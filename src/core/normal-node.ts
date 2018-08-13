import { _attrsStore as attrsStore, getAttrDefinition } from '.';
import { BasicNode } from './node';
import { Observer } from './observer';
import { Watcher } from './observer/watcher';
import {
  ElementType, IAttrFuncCondition,
  IDictionary, ILineHasDws,
  INodeCodeDWS, INormalNodeCode,
  IWatchableElement, NodeRunningStage,
} from './types';
import { handleError, isObject, remove, tip } from './util';

// The default state of each new NormalNode.
// The states of Node created by calling nn() is the result
// of assigning parameter `states` to the default state.
export const defaultState = {
  // the value of `data` won't be watched
  data: {},

  // record how many times the node has run
  runningTimes: 0,

  // how many node now is running
  running: 0,
};

const p = Promise.resolve();

export class NormalNode extends BasicNode implements IWatchableElement {

  public type = ElementType.NormalNode;

  public readonly code: INormalNodeCode;


  public state: IDictionary;
  public watchMe(
    expOrFn: string | ((this: IDictionary, state: IDictionary) => any),
    callback: (newVal: any, oldVal: any) => void,
    {
      deep = false,
      sync = false,
      immediate = false,
    } = {},
  ) {
    let watcher = new Watcher(this.state, expOrFn, callback, { deep, sync });
    this._watchers.push(watcher);

    if (immediate) {
      const value = watcher.getter(this.state);
      callback.call(this.state, value, value);
    }

    return () => {
      if (!watcher) { return; }
      remove(this._watchers, watcher);
      watcher.teardown();
      watcher = null as any;
    };
  }
  private _watchers: Watcher[] = [];
  public get watchers() {
    return this._watchers.slice();
  }


  public clone(): NormalNode {
    const clonedNode = new NormalNode(this.attrs, Object.assign({}, this.state), this.code);
    return clonedNode;
  }


  public destory() {
    for (const fn of this.ondestory) {
      fn.call(this, this);
    }

    this.state = null as any;
    ////////////////////////////////////////////
  }

  private _attrs: {
    own: IDictionary;
    inherited: IDictionary; // own = Obejct.create(inherited) in constructor
    beforeSequence: Array<{ name: string, value: any, priority: number }>;
    afterSequence: Array<{ name: string, value: any, priority: number }>;
  };
  public get attrs(): IDictionary {
    // Clone node's own attrs and return,
    // the inherited attrs are not exposed.
    return Object.assign({}, this._attrs.own);
  }
  public get allAttrs(): IDictionary {
    return Object.assign({}, this._attrs.inherited, this._attrs.own);
  }
  public setAttrs(attrs: Array<{ name: string, value: any }>) {
    if (process.env.NODE_ENV !== 'production') {
      tip('Node.setAttr: Modify attribute while the Node is running may cause unknown errors.');
    }
    for (const attr of attrs) {
      this._attrs.own[attr.name] = attr.value;
    }
    this.sortAttrs();
  }
  public _setInheritAttrs(attrs: Array<{ name: string, value: any }>) {
    for (const attr of attrs) {
      this._attrs.inherited[attr.name] = attr.value;
    }
    this.sortAttrs();
  }
  private sortAttrs() {
    this._attrs.beforeSequence.length = 0;
    this._attrs.afterSequence.length = 0;

    const attr = this._attrs.own;

    // For-in will traverse all the attributes of Node, including its own and inherited.
    for (const name in attr) {
      if (typeof attr[name] === 'undefined' ||
        attrsStore.typed[name] ||
        !attrsStore.normal[name]
      ) { continue; }
      if (attrsStore.normal[name].before) {
        this._attrs.beforeSequence.push({
          name,
          value: attr[name],
          priority: attrsStore.normal[name].beforePriority!,
        });
      }
      if (attrsStore.normal[name].after) {
        this._attrs.afterSequence.push({
          name,
          value: attr[name],
          priority: attrsStore.normal[name].afterPriority!,
        });
      }
    }

    // Sort attributes based on priority.
    this._attrs.beforeSequence.sort((a, b) => a.priority - b.priority);
    this._attrs.afterSequence.sort((a, b) => b.priority - a.priority);
  }

  constructor(attrs: IDictionary, state: IDictionary, code: INormalNodeCode) {
    super(code);
    if (process.env.NODE_ENV !== 'production') {
      if (typeof attrs.sync !== 'undefined' && typeof attrs.sync !== 'boolean') {
        handleError(new Error('Attribution \'sync\' must be set to true or false.'), 'NodeConstructor');
      }
      for (const attrName of Object.keys(attrs)) {
        if (!getAttrDefinition(attrName)) {
          tip(`NodeConstructor: Attr '${
            attrName
            }' has not been installed. It should be installed before the node runs.`);
        } else if (attrsStore.typed[attrName] && typeof attrs[attrName] !== attrsStore.typed[attrName]) {
          handleError(new Error(
            `EventNet.Node: The type of attribution '${attrName}' must be ${attrsStore.typed[attrName]}.`,
          ), 'NodeConstructor');
        }
      }
    }

    this._attrs = {} as any;
    this._attrs.inherited = {};
    this._attrs.own = Object.assign(Object.create(this._attrs.inherited), attrs);
    if (typeof this._attrs.own.sync === 'undefined') {
      this._attrs.own.sync = false;
    }
    this._attrs.beforeSequence = [];
    this._attrs.afterSequence = [];
    this.sortAttrs();

    this.state = Object.assign({}, defaultState, state);
    new Observer(this.state, 'data');
  }
  public run(data?: any, caller?: ILineHasDws): any | Promise<any> {
    if (this._attrs.own.sync) {
      try {
        return this.codeSync(data, caller);
      } catch (error) {
        if (isObject(error) && typeof error.when !== 'undefined') {
          //////////////////////////////////////////////////////////////
          if (typeof error.what !== 'undefined') {
            this._errorHandler(error.when, error.what);
          }
        } else {
          --this.state.running;
          this._errorHandler(NodeRunningStage.code, error);
        }
      }
    } else {
      return p.then(() => {
        return this.codeAsync(data, caller);
      }).catch(error => {
        if (typeof error.when !== 'undefined') {
          //////////////////////////////////////////////////////////////
          if (typeof error.what !== 'undefined') {
            this._errorHandler(error.when, error.what);
          }
        } else {
          --this.state.running;
          this._errorHandler(NodeRunningStage.code, error);
        }
      });
    }
    //////////////////////////////////////////////////////////////
    // Try-catch will copy all the variables in the current scope.
  }

  // public stareArrow(
  //   node: INodeHasUps,
  //   expOrFn: string | (() => any),
  //   callback: (newVal: any, dws: ICallableElementLike | null, oldVal: any) => any,
  //   {
  //     deep = false,
  //     sync = false,
  //     immediate = false,
  //   } = {},
  //   { id, classes }: ILineOptions = {},
  // ) {
  //   const line = new StareArrow(
  //     this,
  //     NormalNode.prototype.watchMe,
  //     expOrFn,
  //     callback,
  //     { deep, sync, immediate },
  //     { id, classes },
  //   );
  //   weld(line.downstream, node.In);
  //   return node;
  // }

  // public starePipe(
  //   node: INodeHasUps,
  //   expOrFn: string | (() => any),
  //   callback: (newVal: any, dws: ICallableElementLike | null, oldVal: any) => any,
  //   {
  //     deep = false,
  //     sync = false,
  //     immediate = false,
  //   } = {},
  //   { id, classes }: ILineOptions = {},
  // ) {
  //   const line = new StarePipe(
  //     this,
  //     NormalNode.prototype.watchMe,
  //     expOrFn,
  //     callback,
  //     { deep, sync, immediate },
  //     { id, classes },
  //   );
  //   weld(line.downstream, node.In);
  //   return node;
  // }

  // public stareTwpipe(
  //   node: INodeHasUps,
  //   expOrFn: string | (() => any),
  //   callback: (newVal: any, dws: ICallableElementLike | null, oldVal: any) => any,
  //   {
  //     deep = false,
  //     sync = false,
  //     immediate = false,
  //   } = {},
  //   { id, classes }: ILineOptions = {},
  // ) {
  //   const line = new StarePipe(
  //     this,
  //     NormalNode.prototype.watchMe,
  //     expOrFn,
  //     callback,
  //     { deep, sync, immediate },
  //     { id, classes },
  //   );
  //   weld(line.downstream, node.In);
  // }

  private async codeAsync(data?: any, caller?: ILineHasDws) {
    ++this.state.runningTimes;

    let runningStage: NodeRunningStage = NodeRunningStage.before;

    ++this.state.running;

    let shutBy: null | NodeRunningStage = null;
    let error: any;
    const errorJudge = () => {
      if (shutBy) {
        runningStage = NodeRunningStage.over;
        --this.state.running;
        throw { when: shutBy, what: error };
      }
    };
    if (this._attrs.beforeSequence.length !== 0) {
      const conditionBefore: IAttrFuncCondition = {
        data,
        attrs: this.allAttrs,
        state: this.state,
        node: this,
        shut: (err?: any) => {
          shutBy = shutBy || NodeRunningStage.before;
          if (typeof err === 'undefined') { return; }
          if (runningStage !== NodeRunningStage.over) {
            error = error || err;
          } else {
            this._errorHandler(NodeRunningStage.before, err);
          }
        },
      };
      for (const attrObj of this._attrs.beforeSequence) {
        await attrsStore.normal[attrObj.name].before!(attrObj.value, conditionBefore);
        errorJudge();
      }
      data = conditionBefore.data;
    }

    runningStage = NodeRunningStage.code;

    let result = await this.code(
      this.Out.wrappedElements as INodeCodeDWS,
      { data, caller },
      {
        origin: this,
        attrs: () => this.attrs,
        allAttrs: () => this.allAttrs,
        state: this.state,
      },
    );

    errorJudge();

    if (this._attrs.afterSequence.length !== 0) {
      runningStage = NodeRunningStage.after;
      const conditionFinish: IAttrFuncCondition = {
        data: result,
        attrs: this.allAttrs,
        state: this.state,
        node: this,
        shut: (err?: any) => {
          shutBy = shutBy || NodeRunningStage.after;
          if (typeof error === 'undefined') { return; }
          error = error || err;
        },
      };
      for (const attrObj of this._attrs.afterSequence) {
        await attrsStore.normal[attrObj.name].after!(attrObj.value, conditionFinish);
        errorJudge();
      }
      result = conditionFinish.data;
    }

    runningStage = NodeRunningStage.over;
    --this.state.running;

    return result;
  }
  private codeSync(data?: any, caller?: ILineHasDws): any {
    ++this.state.runningTimes;

    let runningStage: NodeRunningStage = NodeRunningStage.before;

    ++this.state.running;

    let shutBy: null | NodeRunningStage = null;
    let error: any;
    const errorJudge = () => {
      if (shutBy) {
        runningStage = NodeRunningStage.over;
        --this.state.running;
        throw { when: shutBy, what: error };
      }
    };
    if (this._attrs.beforeSequence.length !== 0) {
      const conditionBefore: IAttrFuncCondition = {
        data,
        attrs: this.allAttrs,
        state: this.state,
        node: this,
        shut: (err?: any) => {
          shutBy = shutBy || NodeRunningStage.before;
          if (typeof err === 'undefined') { return; }
          if (runningStage !== NodeRunningStage.over) {
            error = error || err;
          } else {
            this._errorHandler(NodeRunningStage.before, err);
          }
        },
      };
      for (const attrObj of this._attrs.beforeSequence) {
        attrsStore.normal[attrObj.name].before!(attrObj.value, conditionBefore);
        errorJudge();
      }
      data = conditionBefore.data;
    }

    runningStage = NodeRunningStage.code;

    let result = this.code(
      this.Out.wrappedElements as INodeCodeDWS,
      { data, caller },
      {
        origin: this,
        attrs: () => this.attrs,
        allAttrs: () => this.allAttrs,
        state: this.state,
      },
    );

    errorJudge();

    if (this._attrs.afterSequence.length !== 0) {
      runningStage = NodeRunningStage.after;
      const conditionFinish: IAttrFuncCondition = {
        data: result,
        attrs: this.allAttrs,
        state: this.state,
        node: this,
        shut: (err?: any) => {
          shutBy = shutBy || NodeRunningStage.after;
          if (typeof error === 'undefined') { return; }
          error = error || err;
        },
      };
      for (const attrObj of this._attrs.afterSequence) {
        attrsStore.normal[attrObj.name].after!(attrObj.value, conditionFinish);
        errorJudge();
      }
      result = conditionFinish.data;
    }

    runningStage = NodeRunningStage.over;
    --this.state.running;

    return result;
  }
}
