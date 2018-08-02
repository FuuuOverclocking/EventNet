EventNet 的本质是非常简单的，即有向图。

它将程序流程表示为图的方式，很类似 AOV 网络 (Activity On Vertex Network)，简言之，以顶点表示活动，以边表示活动的关联。**顶点**，**边** 在 EventNet 中分别被称为 **节点 (node)**，**线条 (line)**。对以 EventNet 表示的程序而言，`节点` 对应于程序的 某一个功能点/某一步流程，是对一段逻辑的包装；连接起 `节点` 的 `线条`，是对程序不同功能/流程之间的关联的抽象。

EventNet 也与 AOV 网络 有诸多不同。AOV 网络的边，表示的是相连顶点所代表的事件的前后顺序，这就要求 AOV 网络 不可成环，毕竟环中的活动将引起执行顺序的矛盾。EventNet 的 `线条` 仅仅表示 `节点` 间的关联，这种关联由实际编程赋予其意义。并且 `节点` 也是可以多次被激活的。因此 EventNet 中，环是允许存在的，并且环往往对应于某种循环。事实上，任何可能的有向图都是允许的。

举例来说，有一个程序，不断接收客户端发来的请求，并转发给当前可用的服务器中空闲的某一个。服务器处理完后，发还数据，并变回空闲状态。该程序可这样表示。

![graph example](http://justlog.xyz/eventnet/images/graph-example.png)

图中，新的请求通过 `线条` 流入了 `Customer Entrance` 节点，在其中被包装成一个所谓的 `Customer` ，再流入 `Combine` 节点。

另一方面，每当一个新的服务器上线，或者说，一个新的可用 Server 出现，它会流入到 `Server Entrance` 节点，整理整理状态之类，再流入到 `Combine` 节点。

`Combine` 节点分别维护了 `Customer` 和 `Server` 两个队列，它会把流入的东西装入相应队列。如果两队列均非空，就从队首各取一个进行所谓的 combine，也就是令 Server 服务 Customer ，结束后把 Server 再送回 `Server Entrance` 节点以复用，把 Customer & result 送出。
