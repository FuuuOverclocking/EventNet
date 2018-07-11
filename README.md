[简体中文](README_zh-cn.md)

<p align="center">
  <a href="https://eventnet.justlog.xyz">
    <img src="http://justlog.xyz/eventnet/images/logo.png" alt="" width="120" height="120">
  </a>
  <p align="center">
    Not just about flow design.
    <br>
    <a href="https://eventnet.justlog.xyz"><strong>Explore Docs »</strong></a>
    <br>
    <br>
    <a href="https://github.com/xyzingh/EventNet/issues">Report bug or Request feature</a>
  </p>
</p>

<br>

EventNet is a lightweight programming library for flow design, which describes your program process as a network consists of nodes and lines. And on this basis, an additional, less light visualization tool EN Viewer is provided to help developers - facilitates the reading, debugging, refactoring, and extension of projects.

EventNet is currently rewriting with TypeScript. EN Viewer will be built based on Koa, Socket.IO, TypeScript Parser, etc.

The project is just starting in March and I'll build it as soon as possible. If you read the following sections and find the idea interesting, welcome Issues and PRs, and join as a contributor.

[Dash to getting started >>](#get-started)

[![GitHub issues](https://img.shields.io/github/issues/xyzingh/EventNet.svg?style=flat-square)](https://github.com/xyzingh/EventNet/issues)
[![npm](https://img.shields.io/npm/v/eventnet.svg?style=flat-square)](https://www.npmjs.com/package/eventnet)
[![npm](https://img.shields.io/npm/dm/eventnet.svg?style=flat-square)](https://www.npmjs.com/package/eventnet)
[![GitHub license](https://img.shields.io/github/license/xyzingh/EventNet.svg?style=flat-square)](https://github.com/xyzingh/EventNet/blob/dev-xyz/LICENSE)

## Initial concept

不同于传统的响应式编程，EventNet 用**节点**和它们之间的**连线**表示程序流程。**节点**包装着一系列操作，逻辑上对应于程序的一步流程，或实现一个功能点，或起一些辅助作用；**连线**体现了节点间的关系，表示调用关系，并能传递数据。不仅于此，由于可视化工具的存在，**节点**还相当于设置在程序中的监控单元，EventNet的API的一举一动，都会通过可视化工具的界面，以人类友好的方式，反馈在屏幕上。

依照模块化的思想，一系列相互耦合度较高的 功能点 应当被组织起来，抽象成更高层次的一项功能。相应地，EventNet提供对一群节点构成的网络的折叠和打包功能。

下面的图例粗糙地说明了一个后端如何初始化，同时也展示了可视化工具提供的福利中的“**实时运行情况**”，“**自动计时**”。
![EventNet 图示](http://justlog.xyz/eventnet/images/eventnet_graphic.gif)

### 节点

一个同步或异步函数作为节点的核心。

### 连线

按形状分为：

* ![one-way arrow](http://justlog.xyz/eventnet/images/owarrow.png) 单向箭头(one-way arrow)&nbsp;&nbsp;&nbsp;触发指向的节点
* ![one-way pipe](http://justlog.xyz/eventnet/images/owpipe.png) 单向管道(one-way pipe)&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;触发指向的节点，数据同时通过管道流入
* ![two-way pipe](http://justlog.xyz/eventnet/images/twpipe.png) 双向管道(two-way pipe)&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;可以触发两头的节点，数据双向流动

按智商分为：

* (普通) 连线 只能被动地由节点调用自己
* Clever 连线 主动观察着节点的State变化，并调用下游节点

没有双向箭头，因为当你发现两个节点之间的关系复杂到需要双向箭头时，也许很快会发现其实还需要双向管道。

[Get started](#get-started)一节会给出更详尽的概念定义和代码示例，不过现在先让我们来看看EventNet的可视化工具有多友好 :)

## 可视化工具 EN Viewer

EN Viewer是一个附加的可视化工具，可以运行JS文件，扫描其中的EventNet的API，画出EventNet图示；也可以像个IDE一般，直接修改源码中和EventNet有关的一切。

使用EN Viewer时，自动进入开发者模式，项目将通过WebSocket连接到EN Viewer。你将可以方便地

#### 阅读项目

* 用自然语言命名某个**节点**，添加行为描述（遵循JSDoc规范，自动添加到源码注释中，或从注释中解析出）
* 图示中**节点**和**连线**的亮暗和颜色变化，反映网络的实时运行情况，也可以快放/慢放
* **节点**state的变化可以自定义地视觉化
* 展开**折叠着的网络**或是**打包成的大节点**，查看运行细节

#### 进行调试

* 查看每次**单向/双向管道**传输的数据的快照（因此建议你尽量使用管道来处理节点之间的数据关系）
* 用测试数据测试某个区域内的网络是否正常
* 查看**节点**的运行时间，或是观察**节点**的state随时间的变化，找到需要优化之处
* 直接通过EN Viewer暂停正在运行的网络（甚至是线上的项目），或在指定位置暂停

#### 编辑和修改源码

* 直接点击**节点**或**连线**，修改其属性，类型，编辑代码等等
* 用鼠标点击，拖动来添加**节点**和**连线**，以及调整连接结构
* 创建网络克隆

特别的，如果你的服务器和客户端都用EN构建，它甚至可以将两者的事件网络连接起来，使你看明白整个应用的运行。（瞎话，实现得了吗？）

EN Viewer操作你的源码时的宗旨：

* 尽量保留文件原本风格
* 文本高可读
* 图中靠近的节点，代码靠近
* 切换生产环境不需要改代码

## 探讨 & EventNet最佳实践

### 响应式编程？

响应式编程(Reactive programming) 是一种面向数据流和变化传播的编程范式( [Wiki 传送门](https://en.wikipedia.org/wiki/Reactive_programming) )。说EventNet是类响应式，是由于它不完全符合定义：

* EventNet 更着眼于 通过节点刻画程序流程，而非节点间流动的数据；事实上，节点间很多时候仅仅是调用，没有数据传递
* 数据和数据的变化 在EventNet中不具有特别地位，数据变化是否引起相关操作取决于用户代码
* 虽然概念上不同于响应式编程，但行为上却能够兼容，可以实现相比响应式编程库更多功能

### 与Promise, async/await等异步编程方案的关系？

EventNet并非替代Promise, then等异步方案的工具。

在我看来，上述异步方案，小巧精致，语义性强，是十分适合**微观使用**的。

但放在项目的单元与单元间使用，就有诸多不及EventNet之处，见下节优势分析。

另一方面，EventNet重视可读性，强调能清晰表示项目结构，它的API及推荐的写法都比较显眼。虽然也可以微观上始终用它控制异步流程，但这只会模糊代码本来的语义。

### 优势分析

* 纯函数化： （虽然不是严格的）节点可仅从上游获取参数，处理后发给下游，不影响全局空间
* 模块化： 不自觉地要求并辅助开发者书写模块化的代码
* 可视化： 将功能表示为节点，关联表示为连线，视觉地刻画程序流程，视觉地调试、编辑

例如，某天领导甩给你一个非常可怕的项目要你维护，里面都是屎一般的祖传代码...大家都知道这是什么感觉。

但假如这个项目是用EventNet构建，情况会稍稍好些：虽然每个节点里装着屎，但你可以根据它的name和desc(ription)多少了解一点它的行为，然后把一个节点摘下来，自己重写一个装上去，并用 **管道数据快照** 和 **局部网络调试** 确保行为一致，避免大规模的重构。

### 最佳实践

如果想进一步提高项目的可维护性，建议这样使用EventNet：

* 明智地拆分业务逻辑，每一个节点对应实现一小步流程。须注意这一小步不能太大或太小，太大不便于维护，太小则节点间耦合太强
* 项目开发前期多用普通连线，以表示项目的"固态结构"；缝缝补补阶段时，使用Clever 连线（直接收集节点状态数据），代码修改量小，会比较方便。然而一堆Clever 连线，也即一堆订阅关系，更容易造成状态混乱，应适时重构成偏“固态结构”
* 尽量不要把视图层逻辑分散到节点中去，建议使用MVVM模型
* 节点 上游数据的接收 和 下游结果的发出，尽量依靠 连线 传输，而非使用全局变量
* 节点变得过于庞大时，按功能点拆分成几个子节点
* 意义特殊的操作，尽管代码很短，也为其创建节点
* 遵循JSDoc的规范书写注释，总是用 动词+名词 命名节点，总是添加节点描述，讲清 干了什么，需要什么，返回什么
* 善用克隆和自定义属性，提高代码的复用

以之前图示中的**读取数据库**节点为例，它通过 单向管道 接收上游的配置信息，连接数据库获取数据，并做一些解析处理，再将结果通过管道发给下游。

假设随着项目增长，查询和解析工作日益庞杂，这时就应考虑抓住几个功能点，将它解耦拆分。

# Get started

```javascript
import en from 'eventnet'

let node = en(dws => {
  dws('Hello World~')
})

node.pipeNext() //创建单向管道，连接下个节点

en((dws, ups) => {
  console.log(ups.data)
})

node.run()
```

## Table of contents

* [概览](#overview)
* [Node](#node)
  * [attr](#attr)
  * [内置的 attr](#built-in-attributes)
  * [state](#state)
  * [watcher](#watcher)
* [Line](#line)
* [一大堆内置 Node 和 伪Line](#built-in-nodeslines)
* [打包](#pack)

## Overview

下面给出节点和连线的最完整定义，并非所有特性都是必须的。

### 节点 Node

Node = { **代码**, **属性**, **状态**, **上/下游**, **父节点**, **订阅者**, **名称和描述** }

逻辑上，外界将一个节点看作黑箱，唯一可见的是 上游（指向该节点的连线） 下游（该节点发出的连线） 和 节点的状态以及所属父节点。

|  要素           |                   |  描述  |
| --------------- | ----------------- | --------------------- |
|  `名称` `描述`  |  name desc         |  不是代码的一部分，它们出现在注释里，被EN Viewer自动识别  |
|  `代码`         |  _code             |  节点运行时执行的代码  |
|  `属性`         |  attr              |  调节节点的输入，输出；  影响节点的运行状态和打包克隆行为； 控制抛出错误等。 可以注册自定义的属性  |
|  `状态`         |  state             |  **外界只读** 节点可以随时修改自己的state，外界可以随时获取节点的state  |
|  `上/下游`      |  up/downstream    |  **指的是连线，不是节点** 描述了节点的连接结构  |
|  `订阅者`       |  watcher           |  节点的状态改变时，订阅者们将被通知  |
|  `父节点`       |  parent            |  **只因打包行为而改变** 将一些节点打包得到的大节点，称为这些节点的父节点。 子节点中属性未设置的项将自动继承父节点  |

### 连线 Line

(普通) Line = { **尾部**, **头部**, **类型**, 可选的ID }

Clever Line = { **观察对象**, **代码**, **头部**, **类型**, 建议设置ID }

Line只能被动地由节点调用自己，而Clever Line则主动观察着节点的state变化，并调用下游。

|  要素           |                   |  描述  |
| --------------- | ----------------- | ----------------- |
|  `尾部`         |  tail             | 指向发出连线的节点  |
|  `头部`         |  head             | 指向连线指向的节点  |
|  `观察对象`     |  tail             | Clever Line 的 tail 指向观察着的对象； Clever Line 中的双向管道，head和tail都指向观察着的对象  |
|  `代码`         |  _code            | 被观察观察对象的state改变时调用的代码  |
|  `ID`           |  id               | Clever Line可以凭 ID 或 自身的引用 克隆出新的连线； 普通连线的ID只在局部有效，当节点上连线过多时难分次序时，用以标识自己  |

Line的所谓上下游，指的是节点。双向管道的`tail`和`head`既是上游，也是下游。其他连线的`tail`是上游，`head`是下游。

> 可以如此比喻，(普通) Line 是固定在节点这个黑箱的表面，可以在节点的下游 downstream 中找到；而 Clever Line 是悬浮在节点之外，观察着节点，因而只能在节点的订阅者 watcher 中找到。

------

首先导入EventNet为 en

```javascript
import en from 'eventnet'
```

## Node

### **en( [ attr, ] _code )**

描述：**创建并返回一个节点**。

示例，制造一个定时器节点。

```javascript
let enTimer = en(_code)

function _code(downstream) {
    let timestamp = Date.now()
    setInterval(
        () => downstream.all(Date.now() - timestamp),
        1000)
}
```

上面这个节点将周期性的激发它的所有下游节点。有时候你的脚本可能需要很多定时器，如果分别设置，可能不利于性能，也不太优雅，它在这时用得上。

**参数**

* *Object* `attr` 可选，作为节点的属性，对节点的行为和数据有修饰作用。例：{timelimit: 2000} 若节点运行超过2秒，将抛出错误。
* *Function* `_code` 同步或异步函数，作为节点运行时执行的代码。

属性`attr`原则上一经声明，就不应更改，否则你有必要在注释里指出它何种情况下改变。**不要在节点运行时修改属性**，这可能引起未定义的行为。

`_code` 函数运行时，有这些参数： `_code(dws, ups, thisExec)`

#### `dws` - downstream 与下游有关的方法

##### dws.all(data) 用相同的 data 激发全体下游 

例如，`dws.all('Hello World~')`

##### dws(data) 等同于dws.all

##### dws.get(id [ , data ] ) 返回特定ID的下游

将返回特定ID的下游，如果有 data 参数，将用 data 激活指定下游。

例如，

```javascript
let complain = en(dws => {
    let dwsJobs = dws.get('jobs')
    let dwsCook = dws.get('cook')
    
    dwsCook('Butterfly keyboard is Devil.') // 用一字符串激活ID为Cook的节点
    dwsJobs('iPad is great, which I am typing to write this') // 用一字符串激活ID为Jobs的节点
    
    dws.get('gates', 'IE is just a shit')
    // 等价于
    dws.get('gates')('IE is just a shit')
})

let names = 'jobs cook gates'.spilt(' ')
for(let i = 0; i<3; i++){
    complain.pipeNext({id: names[i]}) // pipeNext 是创建连线的一种方式，稍后会提到，这里的参数设置了它的ID
    en((dws, ups) => {
        console.log(ups.data) // ups.data 稍后会提到，它是上游发来的数据
    })
}
```

##### dws[index]
2. `ups` - upstream 与上游有关的方法
    * ups.caller 指向激活本节点的连线
3. `thisExec` - 包含了本节点本次运行的相关信息 （一个异步节点可能有多个同时运行的实例，可用属性[runPlan](#runPlan)调控）
    * thisExec.node 指向节点本身的引用

##### dws.detach(dataSet) 

> **激发下游时，所给数据与其类型不符？**
>
> * 箭头类型的连线不允许有数据通过，除非是null或undefined，否则将打印警告
> * 管道类型的连线应被提供数据，否则将打印警告
> * 连线仍将激活下游


事实上，对于那些不是起辅助作用的节点，推荐依照[Best practice](#最佳实践)中的规范，以如下格式书写。

```javascript
let node = en(
/**
 * @name 节点的名称
 * @desc 流入节点的数据, 节点的行为, 流出节点的数据
 */
  {...attr},
  function _code {})
```

> 选择`attr`作为首参的理由是，他人阅读时，可以连带着注释一起读。

#### attr 可选，属性

不要在一个节点可能运行的时候修改属性

#### _code 同步或异步函数

```javascript
_code = function( [data,] next1 [, ...nexts]) {
  this.state
}
```

------

### attr

### Built-in attributes

### state

### watcher

## Line

## Built-in Nodes&Lines

## Pack

## License

Code released under the MIT License.
