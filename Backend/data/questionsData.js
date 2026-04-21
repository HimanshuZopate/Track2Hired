const topics = [
  { name: "React", category: "MERN" },
  { name: "Node.js", category: "MERN" },
  { name: "MongoDB", category: "MERN" },
  { name: "Express", category: "MERN" },
  { name: "JavaScript", category: "Fundamentals" },
  { name: "DBMS", category: "Fundamentals" },
  { name: "Operating System", category: "Fundamentals" },
  { name: "Networking", category: "Networking" },
  { name: "REST APIs", category: "Fundamentals" },
  { name: "Cloud (AWS basics)", category: "Cloud" },
  { name: "Git", category: "Tools" },
  { name: "SQL", category: "Data Analyst" },
  { name: "Data Structures", category: "Programming" }
];

const theory = (difficulty, question, answer, explanation, keywords, tags = []) => ({
  type: "Theory",
  difficulty,
  question,
  answer,
  explanation,
  keywords,
  tags
});

const mcq = (difficulty, question, options, answer, explanation, tags = []) => ({
  type: "MCQ",
  difficulty,
  question,
  options,
  answer,
  explanation,
  tags
});

const rawData = {
  React: [
    theory(
      "Easy",
      "What is the Virtual DOM in React?",
      "The Virtual DOM is an in-memory representation of the real DOM. React compares the previous and next virtual tree, then updates only the changed parts in the browser DOM.",
      "React uses the Virtual DOM to reduce direct DOM work and improve rendering efficiency.",
      ["virtual dom", "in memory", "compare", "real dom", "changed parts"],
      ["Frequently Asked"]
    ),
    mcq(
      "Easy",
      "Why does React require a key prop when rendering lists?",
      [
        "To help React identify which list items changed, were added, or were removed",
        "To automatically sort the list before rendering",
        "To make list items globally unique across the entire application",
        "To prevent JSX syntax errors"
      ],
      "To help React identify which list items changed, were added, or were removed",
      "Keys give sibling elements a stable identity so reconciliation works correctly.",
      ["Important"]
    ),
    theory(
      "Medium",
      "What is the difference between controlled and uncontrolled components in React?",
      "A controlled component stores form input state in React state and updates it through event handlers. An uncontrolled component keeps its state in the DOM and is usually accessed with refs.",
      "Controlled components are preferred when you need validation, conditional UI, or a single source of truth.",
      ["controlled", "uncontrolled", "react state", "dom", "refs"]
    ),
    mcq(
      "Medium",
      "Which hook should you use to memoize a callback function between renders?",
      ["useMemo", "useReducer", "useCallback", "useEffect"],
      "useCallback",
      "useCallback memoizes a function reference, while useMemo memoizes a computed value.",
      ["Hooks"]
    ),
    theory(
      "Hard",
      "Explain how React reconciliation works and why keys matter during diffing.",
      "Reconciliation is React's process of comparing the previous element tree with the next one to determine what to update. Keys help React match list elements correctly so component state is preserved and incorrect DOM reuse is avoided.",
      "Without stable keys, React may reuse the wrong component instance when list order changes.",
      ["reconciliation", "diffing", "keys", "preserve state", "list updates"],
      ["Important"]
    ),
    mcq(
      "Hard",
      "Which statement about the cleanup function returned from useEffect is correct?",
      [
        "It runs only once when the component first mounts",
        "It runs before the next effect execution and when the component unmounts",
        "It runs only after a successful API response",
        "It is required in every useEffect"
      ],
      "It runs before the next effect execution and when the component unmounts",
      "Cleanup is used to remove listeners, cancel subscriptions, or clear timers.",
      ["Tricky"]
    )
  ],
  "Node.js": [
    theory(
      "Easy",
      "What is Node.js and when is it a good fit?",
      "Node.js is a JavaScript runtime built on Chrome's V8 engine. It is a good fit for I/O-heavy applications such as APIs, real-time systems, and services handling many concurrent connections.",
      "Node.js is efficient for non-blocking network workloads but not ideal for CPU-heavy work on the main thread.",
      ["runtime", "v8", "io heavy", "concurrent connections", "non blocking"],
      ["Frequently Asked"]
    ),
    mcq(
      "Easy",
      "Which built-in Node.js module is used to create a basic HTTP server?",
      ["http", "fs", "path", "events"],
      "http",
      "The http module provides functions for creating servers and handling requests and responses."
    ),
    theory(
      "Medium",
      "Explain the Node.js event loop.",
      "The event loop is the mechanism that allows Node.js to perform non-blocking I/O. It processes callbacks in phases and moves completed asynchronous work back to the JavaScript thread when the call stack is free.",
      "This is why Node.js can handle many concurrent requests without creating one thread per connection.",
      ["event loop", "non blocking io", "callbacks", "phases", "call stack"],
      ["Important"]
    ),
    mcq(
      "Medium",
      "What is the main difference between process.nextTick() and setImmediate()?",
      [
        "process.nextTick() runs before the event loop continues, while setImmediate() runs in a later phase",
        "setImmediate() runs before process.nextTick() in all cases",
        "Both are exactly the same and can be used interchangeably",
        "process.nextTick() is only available in browsers"
      ],
      "process.nextTick() runs before the event loop continues, while setImmediate() runs in a later phase",
      "process.nextTick() queues work ahead of I/O callbacks, while setImmediate() runs in the check phase.",
      ["Tricky"]
    ),
    theory(
      "Hard",
      "How would you handle CPU-intensive work in a Node.js application?",
      "CPU-intensive work should be offloaded using worker threads, separate services, or background job processors. Otherwise, heavy computation blocks the event loop and delays other requests.",
      "Protecting the event loop is critical to keeping an API responsive.",
      ["cpu intensive", "worker threads", "background jobs", "block event loop", "responsive"]
    ),
    mcq(
      "Hard",
      "Which approach is best for scaling a Node.js application across multiple CPU cores?",
      [
        "Use clustering or worker processes",
        "Only increase the number of promises in the code",
        "Convert all callbacks to synchronous functions",
        "Disable the event loop"
      ],
      "Use clustering or worker processes",
      "Clustering and worker processes let you use multiple CPU cores, unlike a single Node.js process."
    )
  ],
  MongoDB: [
    theory(
      "Easy",
      "What type of database is MongoDB?",
      "MongoDB is a NoSQL, document-oriented database that stores data as flexible BSON documents instead of rows in relational tables.",
      "Its flexible schema is useful when nested or evolving data structures are common.",
      ["nosql", "document oriented", "bson", "flexible schema"]
    ),
    mcq(
      "Easy",
      "Which MongoDB operator checks whether a field exists in a document?",
      ["$exists", "$has", "$typeOf", "$present"],
      "$exists",
      "The $exists operator matches documents based on whether a field is present."
    ),
    theory(
      "Medium",
      "What is an aggregation pipeline in MongoDB?",
      "An aggregation pipeline is a sequence of stages such as $match, $group, $project, and $sort that transform documents step by step to produce analytical or reshaped results.",
      "It is commonly used for reporting, filtering, reshaping, and joining data.",
      ["aggregation pipeline", "stages", "$match", "$group", "$project"]
    ),
    mcq(
      "Medium",
      "What does the $lookup stage do in MongoDB aggregation?",
      [
        "Performs a left outer join with another collection",
        "Creates a new index automatically",
        "Deletes duplicate documents from a collection",
        "Encrypts sensitive fields before returning them"
      ],
      "Performs a left outer join with another collection",
      "$lookup brings related data from another collection into the pipeline result.",
      ["Important"]
    ),
    theory(
      "Hard",
      "When would you embed documents instead of storing references in MongoDB?",
      "Embed documents when related data is read together often, has a one-to-few relationship, and does not grow without bound. Use references when related data is large, shared across many documents, or updated independently.",
      "MongoDB schema design should be driven by access patterns rather than relational habits.",
      ["embed", "references", "one to few", "access patterns", "shared data"],
      ["Important"]
    ),
    mcq(
      "Hard",
      "A query frequently filters by status and sorts by createdAt descending. Which index is usually the best fit?",
      [
        "A compound index on { status: 1, createdAt: -1 }",
        "A text index on status only",
        "A hashed index on createdAt only",
        "No index because sorting is always fast"
      ],
      "A compound index on { status: 1, createdAt: -1 }",
      "A compound index that matches the filter and sort pattern is usually best for this query shape.",
      ["Performance"]
    )
  ],
  Express: [
    theory(
      "Easy",
      "What is middleware in Express.js?",
      "Middleware is a function that has access to req, res, and next. It can modify the request or response, end the request cycle, or pass control to the next middleware.",
      "Middleware is used for logging, authentication, validation, parsing, and centralized error handling.",
      ["middleware", "req", "res", "next", "request cycle"],
      ["Frequently Asked"]
    ),
    mcq(
      "Easy",
      "Which Express middleware is commonly used to parse JSON request bodies?",
      ["express.json()", "express.body()", "app.parseJson()", "req.json()"],
      "express.json()",
      "express.json() parses incoming JSON payloads and exposes the result on req.body."
    ),
    theory(
      "Medium",
      "What is the difference between app.use() and app.get() in Express?",
      "app.use() mounts middleware for one or more paths regardless of HTTP method, while app.get() handles only GET requests for a specific route.",
      "Use app.use() for shared middleware and app.get() for route-specific GET handlers.",
      ["app.use", "app.get", "middleware", "http method", "route handler"]
    ),
    mcq(
      "Medium",
      "How do you forward an error to Express error-handling middleware from inside a route or middleware?",
      ["Call next(err)", "Throw res.error(err)", "Return app.error(err)", "Use req.fail(err)"],
      "Call next(err)",
      "Passing an error to next(err) tells Express to skip normal middleware and invoke the error handler."
    ),
    theory(
      "Hard",
      "Why does the order of middleware matter in an Express application?",
      "Express executes middleware in the order it is registered. If authentication, body parsing, routing, or error handling is mounted in the wrong order, requests can be rejected incorrectly or req.body may be undefined.",
      "Middleware order directly controls how a request flows through the application.",
      ["order", "execution", "body parsing", "authentication", "error handling"],
      ["Important"]
    ),
    mcq(
      "Hard",
      "Which function signature identifies Express error-handling middleware?",
      [
        "(err, req, res, next)",
        "(req, res, next, done)",
        "(req, error, res, next)",
        "(err, request, response)"
      ],
      "(err, req, res, next)",
      "Express recognizes error handlers by the presence of four parameters, including err as the first argument.",
      ["Tricky"]
    )
  ],
  JavaScript: [
    theory(
      "Easy",
      "What is a closure in JavaScript?",
      "A closure is created when a function remembers variables from its lexical scope even after the outer function has finished executing.",
      "Closures are commonly used for private state, callbacks, currying, and factory functions.",
      ["closure", "lexical scope", "remembers variables", "outer function"],
      ["Frequently Asked"]
    ),
    mcq(
      "Easy",
      "What does the === operator check in JavaScript?",
      [
        "Value and type equality without coercion",
        "Only value equality after coercion",
        "Whether two variables reference the same scope",
        "Whether two objects have the same keys"
      ],
      "Value and type equality without coercion",
      "=== performs strict equality and does not coerce types before comparison."
    ),
    theory(
      "Medium",
      "What is event delegation and why is it useful?",
      "Event delegation is a pattern where you attach one event listener to a common parent and handle events for child elements by checking event.target. It is useful for dynamic content and reduces the number of listeners.",
      "It relies on event bubbling to work efficiently.",
      ["event delegation", "parent listener", "event target", "bubbling", "dynamic content"]
    ),
    mcq(
      "Medium",
      "Which statement about the JavaScript event loop is correct?",
      [
        "Microtasks are processed after the current call stack and before the next macrotask",
        "setTimeout callbacks always run before Promise callbacks",
        "The event loop makes JavaScript multi-threaded",
        "The call stack can execute multiple functions at the same time"
      ],
      "Microtasks are processed after the current call stack and before the next macrotask",
      "Promise callbacks are microtasks, so they run before timers once synchronous work finishes.",
      ["Important"]
    ),
    theory(
      "Hard",
      "Explain the prototype chain in JavaScript.",
      "Every object in JavaScript can inherit properties from another object through its internal prototype link. When a property is not found on the object itself, the engine walks up the prototype chain until it finds the property or reaches null.",
      "This is the basis of inheritance in JavaScript; class syntax is built on top of prototypes.",
      ["prototype chain", "inheritance", "property lookup", "object", "null"],
      ["Important"]
    ),
    mcq(
      "Hard",
      "Which statement best describes a closure?",
      [
        "A closure lets an inner function access variables from an outer lexical scope even after the outer function returns",
        "A closure automatically frees all variables after a function call",
        "A closure is a special loop used only for asynchronous code",
        "A closure converts synchronous code into promises"
      ],
      "A closure lets an inner function access variables from an outer lexical scope even after the outer function returns",
      "Closures preserve access to surrounding scope and are a core feature of JavaScript.",
      ["Important"]
    )
  ],
  DBMS: [
    theory(
      "Easy",
      "What are the ACID properties in a DBMS?",
      "ACID stands for Atomicity, Consistency, Isolation, and Durability. These properties ensure reliable transaction processing in a database system.",
      "They are especially important in systems where correctness and transaction safety matter.",
      ["acid", "atomicity", "consistency", "isolation", "durability"],
      ["Frequently Asked"]
    ),
    mcq(
      "Easy",
      "What is the primary purpose of a primary key in a relational table?",
      [
        "To uniquely identify each row",
        "To automatically sort records alphabetically",
        "To store encrypted values only",
        "To replace every foreign key in the schema"
      ],
      "To uniquely identify each row",
      "A primary key uniquely identifies each record and cannot contain duplicate values."
    ),
    theory(
      "Medium",
      "What is normalization, and why is it used?",
      "Normalization is the process of organizing data into related tables to reduce redundancy and prevent update, insert, and delete anomalies.",
      "Common normal forms such as 1NF, 2NF, and 3NF improve data consistency and maintainability.",
      ["normalization", "redundancy", "anomalies", "tables", "consistency"]
    ),
    mcq(
      "Medium",
      "Which concurrency problem occurs when one transaction reads data written by another transaction that has not committed yet?",
      ["Dirty read", "Phantom read", "Deadlock", "Lost update"],
      "Dirty read",
      "A dirty read occurs when uncommitted data is read and may later be rolled back."
    ),
    theory(
      "Hard",
      "How do indexes improve database performance, and what trade-off do they introduce?",
      "Indexes improve read performance by allowing the database engine to locate rows faster without scanning the full table. The trade-off is extra storage and slower writes because inserts, updates, and deletes must also update the index.",
      "Indexes should be chosen based on real query patterns, not added blindly to every column.",
      ["indexes", "read performance", "full table scan", "storage", "write overhead"],
      ["Important"]
    ),
    mcq(
      "Hard",
      "Which SQL join returns all rows from the left table and matching rows from the right table, filling missing matches with NULL?",
      ["LEFT JOIN", "INNER JOIN", "CROSS JOIN", "SELF JOIN"],
      "LEFT JOIN",
      "A LEFT JOIN preserves all rows from the left side even when no match exists on the right side."
    )
  ],
  "Operating System": [
    theory(
      "Easy",
      "What is the difference between a process and a thread?",
      "A process is an independent program in execution with its own memory space, while a thread is a smaller unit of execution inside a process that shares the same memory with other threads of that process.",
      "Threads are lighter than processes but require careful synchronization around shared state.",
      ["process", "thread", "memory space", "shared memory", "execution"],
      ["Frequently Asked"]
    ),
    mcq(
      "Easy",
      "Which scheduling algorithm can cause starvation for long processes if short jobs keep arriving?",
      ["Shortest Job First", "Round Robin", "First Come First Serve", "Multilevel Feedback Queue"],
      "Shortest Job First",
      "Shortest Job First can starve long jobs because shorter jobs may be chosen repeatedly."
    ),
    theory(
      "Medium",
      "What is deadlock in an operating system?",
      "Deadlock is a state in which two or more processes are waiting indefinitely for resources held by each other, so none of them can proceed.",
      "The classic Coffman conditions are mutual exclusion, hold and wait, no preemption, and circular wait.",
      ["deadlock", "resources", "waiting", "coffman conditions", "circular wait"]
    ),
    mcq(
      "Medium",
      "What is the main purpose of virtual memory?",
      [
        "To give processes the illusion of more memory by using disk space along with RAM",
        "To permanently store files after shutdown",
        "To replace CPU scheduling with disk scheduling",
        "To remove the need for cache memory"
      ],
      "To give processes the illusion of more memory by using disk space along with RAM",
      "Virtual memory allows systems to run programs larger than physical RAM by using paging or swapping."
    ),
    theory(
      "Hard",
      "What is context switching and why can too much of it hurt performance?",
      "Context switching is the act of saving the state of one process or thread and restoring another so the CPU can switch execution. Excessive context switching adds overhead because the system spends more time switching than doing useful work.",
      "High context-switch rates can reduce throughput and increase latency in heavily loaded systems.",
      ["context switching", "save state", "restore state", "overhead", "latency"]
    ),
    mcq(
      "Hard",
      "Which page replacement algorithm is known for Belady's anomaly?",
      ["FIFO", "LRU", "Optimal", "Clock"],
      "FIFO",
      "Belady's anomaly is the case where adding more frames can increase page faults under FIFO."
    )
  ],
  Networking: [
    theory(
      "Easy",
      "What is the difference between TCP and UDP?",
      "TCP is connection-oriented and provides reliable, ordered delivery with retransmission and flow control. UDP is connectionless and sends datagrams with lower overhead but no guarantee of delivery or order.",
      "TCP is used where reliability matters; UDP is used where low latency matters more.",
      ["tcp", "udp", "reliable", "ordered", "connectionless"],
      ["Frequently Asked"]
    ),
    mcq(
      "Easy",
      "Which OSI layer is primarily responsible for routing packets between networks?",
      ["Network layer", "Transport layer", "Data link layer", "Application layer"],
      "Network layer",
      "Routing is handled at the network layer, where IP addressing and path selection occur."
    ),
    theory(
      "Medium",
      "How does DNS resolution work at a high level?",
      "DNS resolution translates a domain name into an IP address by checking local caches and then querying recursive and authoritative DNS servers until the address is found.",
      "Without DNS, users would need to remember raw IP addresses instead of domain names.",
      ["dns", "domain name", "ip address", "cache", "authoritative server"]
    ),
    mcq(
      "Medium",
      "What is the purpose of a subnet mask?",
      [
        "To separate the network portion of an IP address from the host portion",
        "To encrypt packets before they leave the router",
        "To replace the default gateway in a LAN",
        "To convert IPv4 addresses into MAC addresses"
      ],
      "To separate the network portion of an IP address from the host portion",
      "A subnet mask tells devices which part of an address refers to the network and which part refers to a host."
    ),
    theory(
      "Hard",
      "What happens during a TLS handshake?",
      "During a TLS handshake, the client and server agree on protocol details, verify the server certificate, exchange key material, and establish shared session keys used to encrypt subsequent communication.",
      "The handshake is what enables HTTPS to provide secure communication over an untrusted network.",
      ["tls handshake", "certificate", "key exchange", "session keys", "encryption"],
      ["Important"]
    ),
    mcq(
      "Hard",
      "What is the main purpose of NAT in many home and office networks?",
      [
        "To translate private IP addresses to public IP addresses",
        "To replace DNS resolution with direct routing",
        "To compress packets before transmission",
        "To guarantee end-to-end encryption"
      ],
      "To translate private IP addresses to public IP addresses",
      "NAT allows multiple devices using private addresses to share a smaller number of public IP addresses."
    )
  ],
  "REST APIs": [
    theory(
      "Easy",
      "What is a REST API?",
      "A REST API is an API style in which resources are identified by URLs and manipulated using standard HTTP methods such as GET, POST, PUT, PATCH, and DELETE.",
      "REST also emphasizes stateless communication, meaning each request contains all the context needed by the server.",
      ["rest api", "resources", "urls", "http methods", "stateless"],
      ["Frequently Asked"]
    ),
    mcq(
      "Easy",
      "What does HTTP status code 404 mean?",
      ["Server error", "Resource not found", "Request successful", "Unauthorized"],
      "Resource not found",
      "A 404 response means the server could not find the requested resource at the specified URL.",
      ["Important"]
    ),
    theory(
      "Medium",
      "What does it mean for an HTTP method to be idempotent?",
      "An idempotent HTTP method can be called multiple times with the same input and still leave the server in the same state as a single call. GET, PUT, and DELETE are commonly idempotent methods.",
      "Idempotency matters for retries and fault-tolerant distributed systems.",
      ["idempotent", "same state", "retries", "put", "delete"]
    ),
    mcq(
      "Medium",
      "Which HTTP method is typically used for partially updating an existing resource?",
      ["PATCH", "GET", "POST", "HEAD"],
      "PATCH",
      "PATCH applies partial updates, whereas PUT usually replaces the entire resource representation."
    ),
    theory(
      "Hard",
      "Why is API versioning important, and what are common ways to do it?",
      "API versioning helps teams introduce breaking changes without immediately breaking existing clients. Common strategies include versioning in the URL, headers, or media type.",
      "Good versioning enables backward compatibility and smoother client migrations.",
      ["versioning", "breaking changes", "backward compatibility", "url", "headers"],
      ["Important"]
    ),
    mcq(
      "Hard",
      "Which status code usually means the client is authenticated but does not have permission to access the resource?",
      ["401", "403", "404", "409"],
      "403",
      "401 usually indicates missing or invalid authentication, while 403 indicates access is understood but forbidden."
    )
  ],
  "Cloud (AWS basics)": [
    theory(
      "Easy",
      "What is Amazon EC2?",
      "Amazon EC2 is a service that provides resizable virtual servers in the cloud so you can run applications without managing physical hardware.",
      "It is commonly used to host APIs, web servers, background workers, and custom workloads.",
      ["ec2", "virtual server", "cloud", "compute", "host applications"]
    ),
    mcq(
      "Easy",
      "Which AWS service is primarily used for object storage?",
      ["Amazon S3", "Amazon RDS", "Amazon EC2", "Amazon SNS"],
      "Amazon S3",
      "S3 is AWS object storage designed for durability, scalability, and wide accessibility."
    ),
    theory(
      "Medium",
      "What is the difference between vertical scaling and horizontal scaling?",
      "Vertical scaling means adding more power to a single machine, such as CPU or memory. Horizontal scaling means adding more machines and distributing traffic or workloads among them.",
      "Cloud platforms make horizontal scaling practical for highly available systems.",
      ["vertical scaling", "horizontal scaling", "single machine", "more machines", "availability"]
    ),
    mcq(
      "Medium",
      "Which AWS service is used to manage users, roles, and permissions?",
      ["IAM", "CloudFront", "Route 53", "Lambda"],
      "IAM",
      "IAM controls identity and access management for AWS resources."
    ),
    theory(
      "Hard",
      "How do Auto Scaling and a Load Balancer improve high availability in AWS?",
      "A Load Balancer distributes incoming traffic across multiple healthy instances, while Auto Scaling adds or removes instances based on demand or health conditions. Together they improve availability, fault tolerance, and elasticity.",
      "This pattern prevents a single instance from becoming a bottleneck or a single point of failure.",
      ["auto scaling", "load balancer", "high availability", "fault tolerance", "elasticity"],
      ["Important"]
    ),
    mcq(
      "Hard",
      "Which AWS storage class is commonly chosen for long-term archival data that is accessed rarely?",
      ["S3 Glacier", "EBS gp3", "S3 Standard", "ElastiCache"],
      "S3 Glacier",
      "S3 Glacier is designed for low-cost archival storage with slower retrieval times."
    )
  ],
  Git: [
    theory(
      "Easy",
      "What is the difference between git fetch and git pull?",
      "git fetch downloads new commits and references from the remote but does not merge them into your current branch. git pull performs a fetch and then integrates the changes into your current branch.",
      "Fetch is safer when you want to inspect incoming changes before merging or rebasing.",
      ["fetch", "pull", "download", "merge", "remote"],
      ["Frequently Asked"]
    ),
    mcq(
      "Easy",
      "Which command stages all tracked and untracked file changes in a repository?",
      ["git add -A", "git stage --all", "git commit -a", "git push --all"],
      "git add -A",
      "git add -A stages new, modified, and deleted files for the next commit."
    ),
    theory(
      "Medium",
      "What is the difference between git merge and git rebase?",
      "git merge combines histories by creating a merge commit, while git rebase rewrites commits so they appear on top of another base commit, producing a linear history.",
      "Rebase can make history cleaner, but it should be used carefully on shared branches.",
      ["merge", "rebase", "history", "merge commit", "linear history"]
    ),
    mcq(
      "Medium",
      "What does git stash do?",
      [
        "Temporarily saves uncommitted changes so you can work on something else",
        "Deletes the last local commit permanently",
        "Pushes code to a backup remote automatically",
        "Squashes all commits on the current branch"
      ],
      "Temporarily saves uncommitted changes so you can work on something else",
      "git stash is useful when you need a clean working directory without committing incomplete work."
    ),
    theory(
      "Hard",
      "How should you handle conflicts during a rebase?",
      "Resolve the conflicting files manually, mark them as resolved with git add, and then continue the rebase with git rebase --continue. If needed, you can abort with git rebase --abort.",
      "Understanding the intent of both sets of changes is more important than blindly choosing one side.",
      ["rebase conflict", "resolve manually", "git add", "rebase continue", "rebase abort"],
      ["Important"]
    ),
    mcq(
      "Hard",
      "Which command undoes the last commit but keeps the changes staged?",
      ["git reset --soft HEAD~1", "git revert HEAD --staged", "git checkout HEAD~1", "git clean -fd"],
      "git reset --soft HEAD~1",
      "A soft reset moves HEAD back while preserving the changes in the staging area."
    )
  ],
  SQL: [
    theory(
      "Easy",
      "What is the difference between WHERE and HAVING in SQL?",
      "WHERE filters rows before grouping, while HAVING filters groups after aggregation has been applied.",
      "Use WHERE for row-level filtering and HAVING for conditions on aggregate results such as COUNT or SUM.",
      ["where", "having", "filter rows", "groups", "aggregation"],
      ["Frequently Asked"]
    ),
    mcq(
      "Easy",
      "Which SQL keyword is used to return only unique values?",
      ["DISTINCT", "UNIQUE", "ONLY", "SEPARATE"],
      "DISTINCT",
      "DISTINCT removes duplicate rows from the result based on the selected columns."
    ),
    theory(
      "Medium",
      "What is the difference between INNER JOIN and LEFT JOIN?",
      "INNER JOIN returns only matching rows from both tables. LEFT JOIN returns all rows from the left table and matched rows from the right table, filling unmatched right-side values with NULL.",
      "Choose the join based on whether unmatched left-side rows must still appear.",
      ["inner join", "left join", "matching rows", "null", "preserve left rows"]
    ),
    mcq(
      "Medium",
      "Which clause is required to count employees per department?",
      ["GROUP BY", "ORDER BY", "HAVING", "LIMIT"],
      "GROUP BY",
      "GROUP BY groups rows with the same department so aggregate functions like COUNT can be applied per group."
    ),
    theory(
      "Hard",
      "Why shouldn't you add indexes to every column in a SQL database?",
      "Indexes speed up reads, but they also consume storage and slow down writes because inserts, updates, and deletes must maintain each index. Too many indexes can hurt overall performance.",
      "Indexes should be selected based on actual query patterns and measured bottlenecks.",
      ["indexes", "reads", "writes", "storage", "query patterns"],
      ["Important"]
    ),
    mcq(
      "Hard",
      "Which SQL window function assigns ranks with gaps when there are ties?",
      ["RANK()", "DENSE_RANK()", "ROW_NUMBER()", "NTILE()"],
      "RANK()",
      "RANK() leaves gaps after ties, unlike DENSE_RANK() which does not."
    )
  ],
  "Data Structures": [
    theory(
      "Easy",
      "What is the difference between a stack and a queue?",
      "A stack follows Last In, First Out (LIFO), while a queue follows First In, First Out (FIFO).",
      "Stacks are common in recursion and function calls, while queues are common in scheduling and breadth-first traversal.",
      ["stack", "queue", "lifo", "fifo", "order"]
    ),
    mcq(
      "Easy",
      "What is the time complexity of binary search on a sorted array?",
      ["O(log n)", "O(n)", "O(1)", "O(n log n)"],
      "O(log n)",
      "Binary search halves the search space on each step, which gives logarithmic time complexity."
    ),
    theory(
      "Medium",
      "How does a hash table handle collisions?",
      "A hash table handles collisions using techniques such as chaining, where multiple items share a bucket using a list, or open addressing, where the table probes for another free slot.",
      "Good hash functions and appropriate resizing help maintain average-case performance.",
      ["hash table", "collisions", "chaining", "open addressing", "bucket"]
    ),
    mcq(
      "Medium",
      "Which graph traversal algorithm typically uses a FIFO queue?",
      ["Breadth-First Search", "Depth-First Search", "Dijkstra only", "Topological Sort only"],
      "Breadth-First Search",
      "BFS explores nodes level by level using a queue, while DFS typically uses recursion or a stack."
    ),
    theory(
      "Hard",
      "Why do balanced binary search trees provide better worst-case performance than an ordinary BST?",
      "Balanced BSTs keep tree height close to log n, so search, insert, and delete operations remain efficient. An unbalanced BST can degrade into a linked list, causing O(n) worst-case time.",
      "Self-balancing trees like AVL and Red-Black Trees maintain structural guarantees after updates.",
      ["balanced bst", "height", "log n", "unbalanced", "worst case"],
      ["Important"]
    ),
    mcq(
      "Hard",
      "What is the time complexity of inserting an element into a binary heap?",
      ["O(log n)", "O(1)", "O(n)", "O(n log n)"],
      "O(log n)",
      "Heap insertion may require bubbling the new element up the tree, which takes logarithmic time."
    )
  ]
};

const getQuestions = () =>
  topics.flatMap(({ name }) =>
    (rawData[name] || []).map((question) => ({
      ...question,
      topicName: name,
      skillName: question.skillName || name
    }))
  );

module.exports = {
  topics,
  getQuestions
};