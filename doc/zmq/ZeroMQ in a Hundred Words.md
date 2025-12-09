# [[ZeroMQ]] in a Hundred Words

![[philosophy]]

[[ZeroMQ]] (also known as [[ØMQ]], 0MQ, or [[zmq]]) 
- looks like an embeddable networking library but 
- acts like a concurrency framework.

It gives you sockets that carry atomic messages across various [[transport]]s like 
- [[in-process]], 
- [[inter-process]], 
- [[net/TCP|TCP]], 
- and [[zmq/multicast|multicast]].

You can connect sockets 
- [[N-to-N]] with patterns like 
- [[fan-out]], 
- [[pub-sub]], 
- [[task distribution]], and 
- [[request-reply]]
