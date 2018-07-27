import { def, hasOwn, hasProto, isObject, isPlainObject } from "../util";
import { arrayMethods, methodsToPatch } from "./array";
import Dep from "./dep";

/**
 * 尝试对 value 创建 Observer 实例，
 * value 如果不是对象或数组，什么都不做。
 * @param value 需要尝试监视的目标
 */
export function observe(value: any) {
    if (!isObject(value)) {
        return;
    }

    let ob: Observer | void;
    if (hasOwn(value, "__ob__") && value.__ob__ instanceof Observer) {
        ob = value.__ob__;
    } else if (
        (Array.isArray(value) || isPlainObject(value)) &&
        Object.isExtensible(value)
    ) {
        ob = new Observer(value);
    }
    return ob;
}

const augment = (Object as any).setPrototypeOf ||
    hasProto ? protoAugment : copyAugment;

function protoAugment(target: any, src: any) {
    target.__proto__ = src;
}

function copyAugment(target: any, src: any) {
    for (const key of methodsToPatch) {
        def(target, key, src[key]);
    }
}

export class Observer {
    public value: any;
    public dep: Dep;
    constructor(value: any, asRoot: boolean = false) {
        this.value = value;
        this.dep = new Dep();
        def(value, "__ob__", this);
        if (Array.isArray(value)) {
            augment(value, arrayMethods);
            this.observeArray(value);
        } else if (!asRoot) {
            this.walk(value);
        } else {
            this.walkExcept(value, "data");
        }
    }
    public walk(value: any) {
        for (const key of Object.keys(value)) {
            defineReactive(value, key);
        }
    }
    public walkExcept(value: any, except: string) {
        for (const key of Object.keys(value)) {
            if (key === except) { continue; }
            defineReactive(value, key);
        }

    }
    public observeArray(items: any[]) {
        // 设置 l = items.length 防止遍历过程中 items 长度变化
        for (let i = 0, l = items.length; i < l; i++) {
            // 直接观察数组元素，不在键上设置 getter/setter
            observe(items[i]);
        }
    }
}

function defineReactive(obj: any, key: string, val?: any) {
    const dep = new Dep();

    const property = Object.getOwnPropertyDescriptor(obj, key);
    if (property && property.configurable === false) {
        return;
    }

    const getter = property!.get;
    const setter = property!.set;
    if ((!getter || setter) && arguments.length === 2) {
        val = obj[key];
    }

    let childOb = observe(val);
    Object.defineProperty(obj, key, {
        enumerable: true,
        configurable: true,
        get() {
            const value = getter ? getter.call(obj) : val;

            if (Dep.target) {
                dep.depend();
                if (childOb) {
                    childOb.dep.depend();
                    if (Array.isArray(value)) {
                        dependArray(value);
                    }
                }
            }

            return value;
        },
        set(newVal) {
            const value = getter ? getter.call(obj) : val;
            if (newVal === value) {
                return;
            }
            if (setter) {
                setter.call(obj, newVal);
            } else {
                val = newVal;
            }
            childOb = observe(newVal);
            dep.notify();
        },
    });
}

function dependArray(value: any[]) {
    for (let e, i = 0, l = value.length; i < l; i++) {
        e = value[i];
        e && e.__ob__ && e.__ob__.dep.depend();
        if (Array.isArray(e)) {
            dependArray(e);
        }
    }
}
