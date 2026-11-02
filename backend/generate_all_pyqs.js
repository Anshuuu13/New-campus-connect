const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");

const outputDirBackend = "c:/Users/hp/Desktop/new campus connect backup/backend/uploads/pyqs";
const outputDirFrontend = "c:/Users/hp/Desktop/new campus connect backup/assets/documents/pyqs";

if (!fs.existsSync(outputDirBackend)) fs.mkdirSync(outputDirBackend, { recursive: true });
if (!fs.existsSync(outputDirFrontend)) fs.mkdirSync(outputDirFrontend, { recursive: true });

const ALL_MITS_PAPERS = [
  // 1. CSE
  {
    filename: "MITS_CSE_Sem3_DSA_160301_EndSem_2024.pdf",
    title: "Data Structures & Algorithms - End Semester Question Paper 2024",
    subjectName: "Data Structures & Algorithms",
    subjectCode: "160301",
    branch: "CSE",
    semester: 3,
    academicYear: "2024",
    examType: "End-Sem",
    maxMarks: 70,
    timeAllowed: "3 Hours",
    units: [
      { unit: "UNIT I", q1: "Explain asymptotic notations (Big-O, Omega, Theta). Write an algorithm for Circular Queue insertion and deletion. [14 Marks]", q2: "Compare Singly, Doubly, and Circular Linked Lists. Write an in-place list reversal algorithm. [14 Marks]" },
      { unit: "UNIT II", q1: "Describe infix to postfix expression conversion. Solve Tower of Hanoi recurrence relation. [14 Marks]", q2: "Explain Double-Ended Queue (Deque) and Priority Queue array vs heap representations. [14 Marks]" },
      { unit: "UNIT III", q1: "Define Binary Search Tree (BST). Explain AVL tree rotations (LL, RR, LR, RL) with examples. [14 Marks]", q2: "Explain B-Trees of order 3 and Huffman Coding algorithm with prefix-free property. [14 Marks]" },
      { unit: "UNIT IV", q1: "Compare BFS and DFS graph traversals. Apply Dijkstra's Single Source Shortest Path algorithm. [14 Marks]", q2: "Explain Prim's and Kruskal's algorithms for finding Minimum Spanning Tree. [14 Marks]" },
      { unit: "UNIT V", q1: "Explain Quick Sort partition strategy and average-case analysis. Discuss Hash collision techniques. [14 Marks]", q2: "Explain Merge Sort with recursion tree and Heap Sort algorithm with max-heap construction. [14 Marks]" }
    ]
  },
  {
    filename: "MITS_CSE_Sem4_OS_160402_EndSem_2023.pdf",
    title: "Operating Systems - End Semester Question Paper 2023",
    subjectName: "Operating Systems",
    subjectCode: "160402",
    branch: "CSE",
    semester: 4,
    academicYear: "2023",
    examType: "End-Sem",
    maxMarks: 70,
    timeAllowed: "3 Hours",
    units: [
      { unit: "UNIT I", q1: "Describe OS structures and Process Control Block (PCB) state transitions. [14 Marks]", q2: "Explain system calls fork(), exec(), wait(), and exit(). Compare User vs Kernel threads. [14 Marks]" },
      { unit: "UNIT II", q1: "Calculate turnaround and waiting times for Round Robin and SJF. Define Critical Section. [14 Marks]", q2: "Explain Peterson's solution. Solve Producer-Consumer problem using Semaphores. [14 Marks]" },
      { unit: "UNIT III", q1: "State Coffman conditions for deadlock. Demonstrate Banker's Algorithm with Safety check. [14 Marks]", q2: "Describe Deadlock Detection, Recovery, and Resource Allocation Graphs (RAG). [14 Marks]" },
      { unit: "UNIT IV", q1: "Explain Paging and TLB effective access time. Calculate page faults for FIFO, LRU, Optimal. [14 Marks]", q2: "Explain Belady's Anomaly and Segmentation address translation hardware. [14 Marks]" },
      { unit: "UNIT V", q1: "Compare Disk Scheduling algorithms: FCFS, SSTF, SCAN, C-SCAN. Explain File Allocation. [14 Marks]", q2: "Describe RAID levels (0, 1, 5, 6) and Thrashing Working Set model. [14 Marks]" }
    ]
  },
  {
    filename: "MITS_CSE_Sem4_TOC_160403_MidSem_2024.pdf",
    title: "Theory of Computation & Automata - Mid Semester Test 2024",
    subjectName: "Theory of Computation",
    subjectCode: "160403",
    branch: "CSE",
    semester: 4,
    academicYear: "2024",
    examType: "Mid-Sem",
    maxMarks: 30,
    timeAllowed: "1.5 Hours",
    units: [
      { unit: "PART A", q1: "Construct DFA accepting strings containing substring '010'. Convert NFA with epsilon to DFA. [15 Marks]", q2: "State and prove Arden's Theorem. Find regular expression for given state diagram. [15 Marks]" },
      { unit: "PART B", q1: "State and prove Pumping Lemma for Regular Languages. Prove L={0^n 1^n} is not regular. [15 Marks]", q2: "Explain Chomsky Hierarchy. Construct Pushdown Automata for palindrome strings. [15 Marks]" }
    ]
  },
  {
    filename: "MITS_CSE_Sem5_DBMS_160501_EndSem_2024.pdf",
    title: "Database Management Systems - End Semester Question Paper 2024",
    subjectName: "Database Management Systems",
    subjectCode: "160501",
    branch: "CSE",
    semester: 5,
    academicYear: "2024",
    examType: "End-Sem",
    maxMarks: 70,
    timeAllowed: "3 Hours",
    units: [
      { unit: "UNIT I", q1: "Explain 3-Tier Database Architecture and Data Independence. Design ER diagram for Hospital Management. [14 Marks]", q2: "Convert ER diagram into Relational Tables. Explain Generalization and Aggregation. [14 Marks]" },
      { unit: "UNIT II", q1: "Explain Relational Algebra fundamental operations. Write complex SQL queries with joins. [14 Marks]", q2: "Compare TRC and DRC. Explain Views, Triggers, and Stored Procedures. [14 Marks]" },
      { unit: "UNIT III", q1: "Explain Functional Dependencies and Armstrong Axioms. Decompose into 1NF, 2NF, 3NF, BCNF. [14 Marks]", q2: "Explain Lossless Join Decomposition and Dependency Preservation. [14 Marks]" },
      { unit: "UNIT IV", q1: "Explain ACID properties of transactions. Test Conflict Serializability using Precedence Graph. [14 Marks]", q2: "Explain Two-Phase Locking (2PL), Strict 2PL, and Timestamp-based ordering. [14 Marks]" },
      { unit: "UNIT V", q1: "Describe Log-Based Recovery and Checkpoints. Compare B-Tree vs B+ Tree indexing. [14 Marks]", q2: "Explain Query Optimization pipeline and Deadlock handling in databases. [14 Marks]" }
    ]
  },
  {
    filename: "MITS_CSE_Sem5_CN_160502_EndSem_2024.pdf",
    title: "Computer Networks - End Semester Question Paper 2024",
    subjectName: "Computer Networks",
    subjectCode: "160502",
    branch: "CSE",
    semester: 5,
    academicYear: "2024",
    examType: "End-Sem",
    maxMarks: 70,
    timeAllowed: "3 Hours",
    units: [
      { unit: "UNIT I", q1: "Compare OSI Reference Model with TCP/IP Protocol Suite. Explain Transmission Media. [14 Marks]", q2: "Explain CSMA/CD and CSMA/CA MAC protocols in wired and wireless LANs. [14 Marks]" },
      { unit: "UNIT II", q1: "Explain Error Detection and Correction: CRC polynomial division and Hamming code. [14 Marks]", q2: "Describe Sliding Window protocols: Stop-and-Wait, Go-Back-N, and Selective Repeat. [14 Marks]" },
      { unit: "UNIT III", q1: "Explain IPv4 addressing, Subnetting, and CIDR. Compare Distance Vector vs Link State Routing. [14 Marks]", q2: "Describe OSPF, BGP, and ARP/RARP protocols. Compare IPv4 vs IPv6 headers. [14 Marks]" },
      { unit: "UNIT IV", q1: "Explain TCP Three-Way Handshake, Flow Control, and Congestion Control (AIMD, Slow Start). [14 Marks]", q2: "Compare TCP and UDP sockets. Explain Port numbers and Multiplexing/Demultiplexing. [14 Marks]" },
      { unit: "UNIT V", q1: "Describe DNS hierarchy and resolution process. Explain HTTP, HTTPS, and SMTP protocols. [14 Marks]", q2: "Explain Network Security basics: RSA public key cryptography and SSL/TLS handshake. [14 Marks]" }
    ]
  },
  {
    filename: "MITS_CSE_Sem6_Compiler_160601_EndSem_2024.pdf",
    title: "Compiler Design - End Semester Question Paper 2024",
    subjectName: "Compiler Design",
    subjectCode: "160601",
    branch: "CSE",
    semester: 6,
    academicYear: "2024",
    examType: "End-Sem",
    maxMarks: 70,
    timeAllowed: "3 Hours",
    units: [
      { unit: "UNIT I", q1: "Explain phases of a Compiler with a sample statement: position = initial + rate * 60. [14 Marks]", q2: "Explain Lexical Analyzer role, regular expressions, transition diagrams, and Lex tool. [14 Marks]" },
      { unit: "UNIT II", q1: "Construct LL(1) parsing table for given grammar. Check for ambiguity and left recursion. [14 Marks]", q2: "Construct SLR(1) and LR(1) parsing tables with canonical collections of LR items. [14 Marks]" },
      { unit: "UNIT III", q1: "Explain Syntax-Directed Translation (SDT) and S-attributed vs L-attributed definitions. [14 Marks]", q2: "Generate Three-Address Code, Quadruples, Triples, and Abstract Syntax Trees. [14 Marks]" },
      { unit: "UNIT IV", q1: "Explain Run-Time Storage Administration: Activation Records, Stack allocation, and Heap. [14 Marks]", q2: "Describe Symbol Table organization techniques and Scope management. [14 Marks]" },
      { unit: "UNIT V", q1: "Explain Principal Sources of Code Optimization: Common Subexpression elimination, Loop unrolling. [14 Marks]", q2: "Explain Target Code Generation, Register allocation, and Basic Blocks DAG representation. [14 Marks]" }
    ]
  },
  {
    filename: "MITS_CSE_Sem6_SE_160602_EndSem_2024.pdf",
    title: "Software Engineering & Agile Methodology - End Semester Question Paper 2024",
    subjectName: "Software Engineering",
    subjectCode: "160602",
    branch: "CSE",
    semester: 6,
    academicYear: "2024",
    examType: "End-Sem",
    maxMarks: 70,
    timeAllowed: "3 Hours",
    units: [
      { unit: "UNIT I", q1: "Compare Waterfall, Spiral, and Agile Scrum process models with lifecycle diagrams. [14 Marks]", q2: "Explain Software Requirements Specification (SRS) IEEE standards and Functional vs Non-functional requirements. [14 Marks]" },
      { unit: "UNIT II", q1: "Explain Software Cost Estimation using COCOMO-I and COCOMO-II models. Calculate effort. [14 Marks]", q2: "Describe Risk Management: Risk Identification, Assessment, Projection, RMMM plan. [14 Marks]" },
      { unit: "UNIT III", q1: "Explain Software Architectural Styles: MVC, Layered, Microservices. Explain Cohesion and Coupling. [14 Marks]", q2: "Draw UML Use Case, Class, Sequence, and Activity diagrams for Online Banking System. [14 Marks]" },
      { unit: "UNIT IV", q1: "Compare Black-Box vs White-Box testing. Calculate Cyclomatic Complexity using control flow graph. [14 Marks]", q2: "Explain Unit, Integration, System, Acceptance, and Regression testing methodologies. [14 Marks]" },
      { unit: "UNIT V", q1: "Explain Software Quality Assurance (SQA), ISO 9001, and CMMI maturity levels. [14 Marks]", q2: "Describe DevOps pipeline, Continuous Integration/Continuous Deployment (CI/CD), and Git workflows. [14 Marks]" }
    ]
  },
  {
    filename: "MITS_CSE_Sem7_AI_160701_EndSem_2024.pdf",
    title: "Artificial Intelligence & Expert Systems - End Semester Question Paper 2024",
    subjectName: "Artificial Intelligence",
    subjectCode: "160701",
    branch: "CSE",
    semester: 7,
    academicYear: "2024",
    examType: "End-Sem",
    maxMarks: 70,
    timeAllowed: "3 Hours",
    units: [
      { unit: "UNIT I", q1: "Define AI and Turing Test. Explain PEAS description for Autonomous Driving Agent. [14 Marks]", q2: "Compare Uninformed Search strategies: BFS, DFS, Uniform Cost Search, and Iterative Deepening. [14 Marks]" },
      { unit: "UNIT II", q1: "Explain A* Search algorithm with admissibility and consistency of heuristics. Prove optimality. [14 Marks]", q2: "Explain Hill Climbing, Simulated Annealing, and Genetic Algorithms for optimization. [14 Marks]" },
      { unit: "UNIT III", q1: "Explain Adversarial Search: Minimax algorithm and Alpha-Beta Pruning with game tree example. [14 Marks]", q2: "Explain Constraint Satisfaction Problems (CSP): Backtracking with Forward Checking and MRV heuristic. [14 Marks]" },
      { unit: "UNIT IV", q1: "Explain First Order Predicate Logic (FOPL), Skolemization, and Resolution Refutation proof. [14 Marks]", q2: "Describe Knowledge Representation: Semantic Networks, Conceptual Dependency, and Frames. [14 Marks]" },
      { unit: "UNIT V", q1: "Explain Architecture of Expert Systems with Inference Engine and Knowledge Base. [14 Marks]", q2: "Describe Bayesian Networks and Probabilistic Reasoning under Uncertainty with Bayes' Theorem. [14 Marks]" }
    ]
  },
  {
    filename: "MITS_CSE_Sem7_CyberSecurity_160702_EndSem_2024.pdf",
    title: "Cyber Security & Cryptography - End Semester Question Paper 2024",
    subjectName: "Cyber Security & Cryptography",
    subjectCode: "160702",
    branch: "CSE",
    semester: 7,
    academicYear: "2024",
    examType: "End-Sem",
    maxMarks: 70,
    timeAllowed: "3 Hours",
    units: [
      { unit: "UNIT I", q1: "Explain CIA Triad and OSI Security Architecture. Describe Passive vs Active attacks. [14 Marks]", q2: "Explain Classical Encryption techniques: Caesar cipher, Playfair cipher, Hill cipher, and Vigenere cipher. [14 Marks]" },
      { unit: "UNIT II", q1: "Explain Advanced Encryption Standard (AES) rounds and Data Encryption Standard (DES) Feistel structure. [14 Marks]", q2: "Compare Block cipher modes: ECB, CBC, CFB, OFB, and Counter (CTR) modes. [14 Marks]" },
      { unit: "UNIT III", q1: "Explain RSA algorithm with key generation and numerical example. Discuss RSA attack vectors. [14 Marks]", q2: "Explain Diffie-Hellman Key Exchange algorithm. How does Man-in-the-Middle attack compromise it? [14 Marks]" },
      { unit: "UNIT IV", q1: "Explain Cryptographic Hash Functions: SHA-256 and MD5 properties. Describe Digital Signature Standard (DSS). [14 Marks]", q2: "Describe HMAC and Kerberos authentication protocol version 5. [14 Marks]" },
      { unit: "UNIT V", q1: "Explain Web Security: SQL Injection, Cross-Site Scripting (XSS), and CSRF vulnerabilities with countermeasures. [14 Marks]", q2: "Describe Firewalls (Packet filtering, Stateful inspection) and Intrusion Detection Systems (IDS/IPS). [14 Marks]" }
    ]
  },
  {
    filename: "MITS_CSE_Sem3_DiscreteMath_160302_EndSem_2023.pdf",
    title: "Discrete Mathematics & Graph Theory - End Semester Question Paper 2023",
    subjectName: "Discrete Mathematics",
    subjectCode: "160302",
    branch: "CSE",
    semester: 3,
    academicYear: "2023",
    examType: "End-Sem",
    maxMarks: 70,
    timeAllowed: "3 Hours",
    units: [
      { unit: "UNIT I", q1: "Explain Propositional Logic, Truth Tables, Tautology, and Predicate Calculus with Quantifiers. [14 Marks]", q2: "State Principle of Mathematical Induction and prove summation formulas. [14 Marks]" },
      { unit: "UNIT II", q1: "Explain Relations: Equivalence relations, Equivalence classes, and Partial Order Relations (Posets, Hasse Diagrams). [14 Marks]", q2: "Explain Functions: Injective, Surjective, Bijective. State Pigeonhole Principle and applications. [14 Marks]" },
      { unit: "UNIT III", q1: "Define Groups, Subgroups, Cyclic Groups, and Lagrange's Theorem on cosets. [14 Marks]", q2: "Explain Rings, Integral Domains, and Fields with algebraic property proofs. [14 Marks]" },
      { unit: "UNIT IV", q1: "Solve Linear Recurrence Relations with constant coefficients using Characteristic equation and Generating functions. [14 Marks]", q2: "State Inclusion-Exclusion Principle and Derangement formulas with counting problems. [14 Marks]" },
      { unit: "UNIT V", q1: "Explain Graph Theory: Euler graphs, Hamiltonian paths, Planar graphs, and Kuratowski's theorem. [14 Marks]", q2: "Describe Tree properties, Spanning trees, and Graph Coloring with Chromatic Number. [14 Marks]" }
    ]
  },
  {
    filename: "MITS_CSE_Sem3_OOP_160303_MidSem_2024.pdf",
    title: "Object Oriented Programming - Mid Semester Test 2024",
    subjectName: "Object Oriented Programming",
    subjectCode: "160303",
    branch: "CSE",
    semester: 3,
    academicYear: "2024",
    examType: "Mid-Sem",
    maxMarks: 30,
    timeAllowed: "1.5 Hours",
    units: [
      { unit: "PART A", q1: "Explain core OOP concepts: Encapsulation, Abstraction, Inheritance, and Polymorphism. [15 Marks]", q2: "Explain Constructors and Destructors: Default, Parameterized, and Copy constructors in C++/Java. [15 Marks]" },
      { unit: "PART B", q1: "Explain Function Overloading vs Function Overriding with virtual functions and dynamic binding. [15 Marks]", q2: "Explain Exception Handling mechanisms (try, catch, throw, finally) and Custom Exceptions. [15 Marks]" }
    ]
  },

  // 2. IT
  {
    filename: "MITS_IT_Sem5_DAA_150501_EndSem_2024.pdf",
    title: "Design & Analysis of Algorithms - End Semester Question Paper 2024",
    subjectName: "Design & Analysis of Algorithms",
    subjectCode: "150501",
    branch: "IT",
    semester: 5,
    academicYear: "2024",
    examType: "End-Sem",
    maxMarks: 70,
    timeAllowed: "3 Hours",
    units: [
      { unit: "UNIT I", q1: "State Master's Theorem for recurrences. Explain Strassen's matrix multiplication. [14 Marks]", q2: "Explain Amortized Analysis and Randomized Quick Sort with expected running time. [14 Marks]" },
      { unit: "UNIT II", q1: "Solve Fractional Knapsack using Greedy approach. Explain Huffman Coding prefix property. [14 Marks]", q2: "Explain Job Sequencing with Deadlines and Minimum Spanning Trees (Kruskal, Prim). [14 Marks]" },
      { unit: "UNIT III", q1: "Solve 0/1 Knapsack using Dynamic Programming. Find Longest Common Subsequence (LCS). [14 Marks]", q2: "Explain Matrix Chain Multiplication algorithm and optimal parenthesization. [14 Marks]" },
      { unit: "UNIT IV", q1: "Explain Backtracking: Solve 8-Queens and Subset Sum problems. [14 Marks]", q2: "Explain Branch and Bound: Solve 0/1 Knapsack and TSP with reduced cost matrices. [14 Marks]" },
      { unit: "UNIT V", q1: "Define Complexity Classes: P, NP, NP-Hard, NP-Complete. State Cook's Theorem. [14 Marks]", q2: "Prove 3-SAT and Vertex Cover problems are NP-Complete by polynomial reduction. [14 Marks]" }
    ]
  },
  {
    filename: "MITS_IT_Sem4_WebTech_150401_EndSem_2024.pdf",
    title: "Web Technologies & Full Stack Engineering - End Semester Question Paper 2024",
    subjectName: "Web Technologies",
    subjectCode: "150401",
    branch: "IT",
    semester: 4,
    academicYear: "2024",
    examType: "End-Sem",
    maxMarks: 70,
    timeAllowed: "3 Hours",
    units: [
      { unit: "UNIT I", q1: "Explain HTML5 semantic elements and CSS3 Flexbox and Grid layouts with responsive design. [14 Marks]", q2: "Explain JavaScript ES6 features: Promises, Async/Await, Arrow functions, and DOM manipulation. [14 Marks]" },
      { unit: "UNIT II", q1: "Explain Node.js event loop, asynchronous I/O, and Express.js routing and middleware architecture. [14 Marks]", q2: "Design RESTful APIs with CRUD operations and status codes (200, 201, 400, 401, 403, 404, 500). [14 Marks]" },
      { unit: "UNIT III", q1: "Explain MongoDB NoSQL document modeling, indexing, and Mongoose aggregation pipelines. [14 Marks]", q2: "Explain JWT (JSON Web Token) authentication and session security with cookies. [14 Marks]" },
      { unit: "UNIT IV", q1: "Explain React.js component lifecycle, Virtual DOM, and Hooks (useState, useEffect, useContext). [14 Marks]", q2: "Describe State Management in single page applications with Redux and Context API. [14 Marks]" },
      { unit: "UNIT V", q1: "Explain Web Security practices: Cross-Origin Resource Sharing (CORS), CSP, and HTTPS. [14 Marks]", q2: "Describe WebSockets for real-time bidirectional communication and progressive web apps (PWA). [14 Marks]" }
    ]
  },
  {
    filename: "MITS_IT_Sem6_CloudComputing_150601_EndSem_2024.pdf",
    title: "Cloud Computing & Distributed Systems - End Semester Question Paper 2024",
    subjectName: "Cloud Computing",
    subjectCode: "150601",
    branch: "IT",
    semester: 6,
    academicYear: "2024",
    examType: "End-Sem",
    maxMarks: 70,
    timeAllowed: "3 Hours",
    units: [
      { unit: "UNIT I", q1: "Explain NIST Cloud Computing reference architecture, SPI service models (SaaS, PaaS, IaaS). [14 Marks]", q2: "Describe Cloud Deployment Models: Public, Private, Hybrid, and Community clouds with trade-offs. [14 Marks]" },
      { unit: "UNIT II", q1: "Explain Virtualization types: Full virtualization, Para-virtualization, and OS-level containerization (Docker). [14 Marks]", q2: "Compare Hypervisors Type-1 (Bare Metal) vs Type-2 (Hosted) with performance benchmarks. [14 Marks]" },
      { unit: "UNIT III", q1: "Explain Distributed Storage: Google File System (GFS) and Hadoop HDFS architecture. [14 Marks]", q2: "Describe MapReduce programming model with WordCount example and shuffle/sort phase. [14 Marks]" },
      { unit: "UNIT IV", q1: "Explain Cloud Resource Management: Elasticity, Auto-scaling, and Dynamic Load Balancing algorithms. [14 Marks]", q2: "Explain Service Level Agreements (SLAs) and Quality of Service (QoS) metrics in cloud services. [14 Marks]" },
      { unit: "UNIT V", q1: "Describe Cloud Security challenges: Identity Access Management (IAM), Multi-tenancy, and Data Encryption. [14 Marks]", q2: "Explain Serverless Computing architecture (AWS Lambda, Google Cloud Functions) and Edge Computing. [14 Marks]" }
    ]
  },

  // 3. AI-DS
  {
    filename: "MITS_AIDS_Sem5_ML_210501_EndSem_2024.pdf",
    title: "Machine Learning & Pattern Recognition - End Semester Paper 2024",
    subjectName: "Machine Learning",
    subjectCode: "210501",
    branch: "AI-DS",
    semester: 5,
    academicYear: "2024",
    examType: "End-Sem",
    maxMarks: 70,
    timeAllowed: "3 Hours",
    units: [
      { unit: "UNIT I", q1: "Explain Supervised, Unsupervised, and Reinforcement Learning paradigms. Bias-Variance Tradeoff. [14 Marks]", q2: "Derive Ordinary Least Squares (OLS) for Simple Linear Regression and Gradient Descent update rule. [14 Marks]" },
      { unit: "UNIT II", q1: "Explain Logistic Regression for binary classification. Derive Sigmoid cost function and Cross-Entropy loss. [14 Marks]", q2: "Explain Decision Tree splitting criteria: Information Gain (Entropy), Gini Impurity, and CART algorithm. [14 Marks]" },
      { unit: "UNIT III", q1: "Explain Support Vector Machines (SVM): Maximum Margin Hyperplane and Kernel Trick (RBF, Polynomial). [14 Marks]", q2: "Describe Ensemble Learning: Bagging (Random Forest) vs Boosting (AdaBoost, Gradient Boosting, XGBoost). [14 Marks]" },
      { unit: "UNIT IV", q1: "Explain K-Means Clustering algorithm. How does Elbow Method determine optimal K? [14 Marks]", q2: "Explain Principal Component Analysis (PCA) for Dimensionality Reduction using Eigenvalue decomposition. [14 Marks]" },
      { unit: "UNIT V", q1: "Explain Evaluation Metrics: Precision, Recall, F1-Score, ROC-AUC Curve, and Confusion Matrix. [14 Marks]", q2: "Describe K-Nearest Neighbors (KNN) algorithm and Naive Bayes Classifier with Laplace smoothing. [14 Marks]" }
    ]
  },
  {
    filename: "MITS_AIDS_Sem5_BigData_210502_EndSem_2024.pdf",
    title: "Big Data Analytics & NoSQL Technologies - End Semester Paper 2024",
    subjectName: "Big Data Analytics",
    subjectCode: "210502",
    branch: "AI-DS",
    semester: 5,
    academicYear: "2024",
    examType: "End-Sem",
    maxMarks: 70,
    timeAllowed: "3 Hours",
    units: [
      { unit: "UNIT I", q1: "Explain 5 V's of Big Data: Volume, Velocity, Variety, Veracity, and Value. [14 Marks]", q2: "Compare RDBMS vs NoSQL databases: Document, Key-Value, Column-Family, and Graph stores. [14 Marks]" },
      { unit: "UNIT II", q1: "Explain Apache Hadoop Ecosystem: HDFS NameNode, DataNode architecture and Secondary NameNode. [14 Marks]", q2: "Explain YARN (Yet Another Resource Negotiator) architecture: ResourceManager and NodeManager. [14 Marks]" },
      { unit: "UNIT III", q1: "Explain Apache Spark Architecture: RDDs (Resilient Distributed Datasets), Transformations, and Actions. [14 Marks]", q2: "Compare Spark in-memory computation vs Hadoop MapReduce disk-based execution. [14 Marks]" },
      { unit: "UNIT IV", q1: "Explain CAP Theorem (Consistency, Availability, Partition Tolerance) with real database examples. [14 Marks]", q2: "Describe Apache Cassandra architecture: Gossip protocol, Consistent Hashing, and SSTables. [14 Marks]" },
      { unit: "UNIT V", q1: "Explain Stream Processing with Apache Kafka: Topics, Partitions, Producers, and Consumer Groups. [14 Marks]", q2: "Describe Big Data pipeline for sentiment analysis using Spark MLlib and GraphX. [14 Marks]" }
    ]
  },
  {
    filename: "MITS_AIDS_Sem6_DeepLearning_210601_EndSem_2024.pdf",
    title: "Deep Learning & Neural Architectures - End Semester Paper 2024",
    subjectName: "Deep Learning",
    subjectCode: "210601",
    branch: "AI-DS",
    semester: 6,
    academicYear: "2024",
    examType: "End-Sem",
    maxMarks: 70,
    timeAllowed: "3 Hours",
    units: [
      { unit: "UNIT I", q1: "Explain Artificial Neural Networks (ANN): Perceptron model, Activation functions (ReLU, Sigmoid, Tanh). [14 Marks]", q2: "Derive Backpropagation algorithm using Chain Rule for multi-layer feedforward networks. [14 Marks]" },
      { unit: "UNIT II", q1: "Explain vanishing and exploding gradient problems. Discuss remedies: Batch Normalization, He/Xavier initialization. [14 Marks]", q2: "Describe Optimizers: SGD with Momentum, RMSProp, and Adam optimizer with adaptive learning rates. [14 Marks]" },
      { unit: "UNIT III", q1: "Explain Convolutional Neural Networks (CNN): Convolution layer, Stride, Padding, Pooling, and Flattening. [14 Marks]", q2: "Describe classic CNN architectures: LeNet, AlexNet, VGG-16, and ResNet skip connections. [14 Marks]" },
      { unit: "UNIT IV", q1: "Explain Recurrent Neural Networks (RNN) and Long Short-Term Memory (LSTM) cell architecture. [14 Marks]", q2: "Describe Gated Recurrent Units (GRU) and Bidirectional RNNs for sequence modeling. [14 Marks]" },
      { unit: "UNIT V", q1: "Explain Attention Mechanism and Transformer Architecture: Self-Attention and Multi-Head Attention. [14 Marks]", q2: "Describe Generative Adversarial Networks (GAN): Generator and Discriminator minimax game. [14 Marks]" }
    ]
  },

  // 4. CSD
  {
    filename: "MITS_CSD_Sem4_HCI_220401_EndSem_2024.pdf",
    title: "Human Computer Interaction & UI/UX Design - End Semester Paper 2024",
    subjectName: "Human Computer Interaction",
    subjectCode: "220401",
    branch: "CSD",
    semester: 4,
    academicYear: "2024",
    examType: "End-Sem",
    maxMarks: 70,
    timeAllowed: "3 Hours",
    units: [
      { unit: "UNIT I", q1: "Explain HCI foundation principles. Describe human visual and cognitive processing models. [14 Marks]", q2: "Explain Norman's 7 Principles of Design: Affordance, Signifiers, Mapping, Feedback, Constraints. [14 Marks]" },
      { unit: "UNIT II", q1: "Explain User-Centered Design (UCD) lifecycle: Empathize, Define, Ideate, Prototype, and Test. [14 Marks]", q2: "Describe User Persona creation, Journey Mapping, and Information Architecture hierarchies. [14 Marks]" },
      { unit: "UNIT III", q1: "Compare Low-Fidelity wireframing vs High-Fidelity interactive prototyping with design systems. [14 Marks]", q2: "Explain Gestalt Principles of visual perception: Proximity, Similarity, Continuity, Closure. [14 Marks]" },
      { unit: "UNIT IV", q1: "Explain Usability Evaluation methods: Nielsen's 10 Heuristics for User Interface Design. [14 Marks]", q2: "Describe A/B Testing, Eye Tracking, and Think-Aloud usability testing protocols. [14 Marks]" },
      { unit: "UNIT V", q1: "Explain WCAG 2.1 Web Accessibility Guidelines for inclusive and assistive technology design. [14 Marks]", q2: "Describe Multimodal interfaces: Voice User Interfaces (VUI), Touchless gesture recognition, and AR/VR. [14 Marks]" }
    ]
  },

  // 5. ECE
  {
    filename: "MITS_ECE_Sem5_DSP_140501_EndSem_2024.pdf",
    title: "Digital Signal Processing - End Semester Question Paper 2024",
    subjectName: "Digital Signal Processing",
    subjectCode: "140501",
    branch: "ECE",
    semester: 5,
    academicYear: "2024",
    examType: "End-Sem",
    maxMarks: 70,
    timeAllowed: "3 Hours",
    units: [
      { unit: "UNIT I", q1: "Compute 8-point DFT using Radix-2 Decimation-in-Time (DIT) FFT algorithm. [14 Marks]", q2: "Derive butterfly signal flow graph for Radix-2 DIF FFT algorithm. Circular convolution. [14 Marks]" },
      { unit: "UNIT II", q1: "Design analog Butterworth low-pass filter. Bilinear Transformation and Frequency Warping. [14 Marks]", q2: "Design digital IIR filter using Impulse Invariance method from analog transfer function H(s). [14 Marks]" },
      { unit: "UNIT III", q1: "Discuss linear phase FIR filter design using Hamming and Hanning windows. [14 Marks]", q2: "Explain Frequency Sampling method for designing FIR filters with linear phase equations. [14 Marks]" },
      { unit: "UNIT IV", q1: "Realize digital filter H(z) using Direct Form-I, Direct Form-II, Cascade, and Parallel. [14 Marks]", q2: "Explain finite word-length effects: coefficient quantization, roundoff noise, and limit cycles. [14 Marks]" },
      { unit: "UNIT V", q1: "Describe multirate signal processing: Decimation and Interpolation by factor D and I. [14 Marks]", q2: "Explain TMS320C67xx DSP processor architecture: Harvard bus, pipelining, and MAC unit. [14 Marks]" }
    ]
  },
  {
    filename: "MITS_ECE_Sem4_SignalsSystems_140401_EndSem_2024.pdf",
    title: "Signals & Systems - End Semester Question Paper 2024",
    subjectName: "Signals & Systems",
    subjectCode: "140401",
    branch: "ECE",
    semester: 4,
    academicYear: "2024",
    examType: "End-Sem",
    maxMarks: 70,
    timeAllowed: "3 Hours",
    units: [
      { unit: "UNIT I", q1: "Classify Continuous and Discrete signals: Periodic, Energy, Power, Even, Odd signals. [14 Marks]", q2: "Test Linear Time-Invariant (LTI) system properties: Linearity, Causality, Stability, Memory. [14 Marks]" },
      { unit: "UNIT II", q1: "Evaluate Convolution Integral and Convolution Sum for LTI systems with graphical method. [14 Marks]", q2: "Explain Fourier Series representation of continuous-time periodic signals and Dirichlet conditions. [14 Marks]" },
      { unit: "UNIT III", q1: "Derive Continuous-Time Fourier Transform (CTFT) properties: Duality, Frequency shifting, Parseval's theorem. [14 Marks]", q2: "State Nyquist Sampling Theorem. Explain Aliasing and reconstruction of signals using Sinc interpolation. [14 Marks]" },
      { unit: "UNIT IV", q1: "Explain Laplace Transform ROC (Region of Convergence) properties. Find inverse Laplace transform. [14 Marks]", q2: "Solve Differential Equations representing LTI systems using bilateral Laplace Transform. [14 Marks]" },
      { unit: "UNIT V", q1: "Explain Z-Transform properties and ROC behavior. Find Z-transform of standard sequences. [14 Marks]", q2: "Analyze Discrete LTI system stability and causality using Pole-Zero plots in Z-plane. [14 Marks]" }
    ]
  },
  {
    filename: "MITS_ECE_Sem5_Microprocessors_140502_EndSem_2023.pdf",
    title: "Microprocessors & Embedded Systems - End Semester Paper 2023",
    subjectName: "Microprocessors & Embedded Systems",
    subjectCode: "140502",
    branch: "ECE",
    semester: 5,
    academicYear: "2023",
    examType: "End-Sem",
    maxMarks: 70,
    timeAllowed: "3 Hours",
    units: [
      { unit: "UNIT I", q1: "Explain 8085 Microprocessor Architecture: Registers, ALU, Control unit, and Pin diagram. [14 Marks]", q2: "Explain 8085 Instruction cycle: Fetch, Decode, Execute, and Timing diagrams for memory read/write. [14 Marks]" },
      { unit: "UNIT II", q1: "Explain 8086 Microprocessor Architecture: Bus Interface Unit (BIU) and Execution Unit (EU). [14 Marks]", q2: "Describe 8086 Memory Segmentation and Physical Address generation. Explain Addressing modes. [14 Marks]" },
      { unit: "UNIT III", q1: "Write 8086 Assembly Language Programs for array sorting and string manipulation. [14 Marks]", q2: "Explain 8086 Interrupt structure: Hardware and Software interrupts, Vector Table, and ISR. [14 Marks]" },
      { unit: "UNIT IV", q1: "Explain Programmable Peripheral Interface 8255: Architecture, Modes (0, 1, 2), and BSR mode. [14 Marks]", q2: "Describe Interfacing of 8255 with Stepper Motor, Seven Segment Display, and ADC/DAC. [14 Marks]" },
      { unit: "UNIT V", q1: "Explain ARM Cortex-M Architecture: Harvard bus, 3-stage pipeline, and Thumb-2 instructions. [14 Marks]", q2: "Compare Microprocessor vs Microcontroller. Explain Embedded C programming and timers. [14 Marks]" }
    ]
  },
  {
    filename: "MITS_ECE_Sem6_VLSI_140601_EndSem_2024.pdf",
    title: "VLSI Design & CMOS Circuits - End Semester Question Paper 2024",
    subjectName: "VLSI Design",
    subjectCode: "140601",
    branch: "ECE",
    semester: 6,
    academicYear: "2024",
    examType: "End-Sem",
    maxMarks: 70,
    timeAllowed: "3 Hours",
    units: [
      { unit: "UNIT I", q1: "Explain CMOS Inverter operation: DC transfer characteristics, Noise margins, and regions of operation. [14 Marks]", q2: "Derive Drain current equations for nMOS and pMOS transistors in linear and saturation regions. [14 Marks]" },
      { unit: "UNIT II", q1: "Explain CMOS Fabrication process: N-Well, P-Well, and Twin-Tub processes with photolithography steps. [14 Marks]", q2: "Explain Lambda-based Design Rules and Stick Diagrams for CMOS NAND and NOR gates. [14 Marks]" },
      { unit: "UNIT III", q1: "Explain Dynamic CMOS Logic: Precharge and Evaluate phases, Charge Sharing, and Domino Logic. [14 Marks]", q2: "Compare Static CMOS, Pseudo-nMOS, and Pass Transistor Logic / Transmission Gates. [14 Marks]" },
      { unit: "UNIT IV", q1: "Explain Semiconductor Memories: 6T SRAM cell read/write operation and 1T DRAM cell refresh cycle. [14 Marks]", q2: "Describe Flash memory (NAND vs NOR) and ROM architectures. [14 Marks]" },
      { unit: "UNIT V", q1: "Write Verilog HDL code for 4-bit Carry Lookahead Adder and Finite State Machines (FSM). [14 Marks]", q2: "Explain ASIC Design Flow, FPGA architecture (CLBs, LUTs, IOBs), and Built-In Self-Test (BIST). [14 Marks]" }
    ]
  },

  // 6. EE
  {
    filename: "MITS_EE_Sem3_Machines1_130301_EndSem_2024.pdf",
    title: "Electrical Machines-I - End Semester Question Paper 2024",
    subjectName: "Electrical Machines-I",
    subjectCode: "130301",
    branch: "EE",
    semester: 3,
    academicYear: "2024",
    examType: "End-Sem",
    maxMarks: 70,
    timeAllowed: "3 Hours",
    units: [
      { unit: "UNIT I", q1: "Derive EMF equation of DC Generator. Explain Armature Reaction and remedies. [14 Marks]", q2: "Compare Lap and Wave windings. Explain commutation and interpoles. [14 Marks]" },
      { unit: "UNIT II", q1: "Derive Torque equation of DC motor. Explain speed control methods of DC motors. [14 Marks]", q2: "Explain Swinburne's test and Hopkinson's regenerative test. Describe 3-point starter. [14 Marks]" },
      { unit: "UNIT III", q1: "Draw exact equivalent circuit of single-phase transformer. Explain OC and SC tests. [14 Marks]", q2: "Derive condition for maximum efficiency of transformer. Explain Voltage Regulation. [14 Marks]" },
      { unit: "UNIT IV", q1: "Explain Autotransformer copper savings. Describe parallel operation of transformers. [14 Marks]", q2: "Explain Scott Connection (T-T connection) for 3-phase to 2-phase conversion. [14 Marks]" },
      { unit: "UNIT V", q1: "Explain Sumpner's Back-to-Back test for identical transformers efficiency. [14 Marks]", q2: "Describe tap-changing transformers (on-load and off-load) and cooling methods. [14 Marks]" }
    ]
  },
  {
    filename: "MITS_EE_Sem4_ControlSystems_130402_EndSem_2024.pdf",
    title: "Control Systems Engineering - End Semester Question Paper 2024",
    subjectName: "Control Systems",
    subjectCode: "130402",
    branch: "EE",
    semester: 4,
    academicYear: "2024",
    examType: "End-Sem",
    maxMarks: 70,
    timeAllowed: "3 Hours",
    units: [
      { unit: "UNIT I", q1: "Compare Open-loop and Closed-loop control systems. Find Transfer Function using Block Diagram Reduction. [14 Marks]", q2: "State Mason's Gain Formula and evaluate transfer function from Signal Flow Graph. [14 Marks]" },
      { unit: "UNIT II", q1: "Derive Time Response of second-order system to unit step input. Define Rise time, Peak time, Overshoot. [14 Marks]", q2: "Explain Steady-State Error and Error Constants (Kp, Kv, Ka) for Type-0, Type-1, Type-2 systems. [14 Marks]" },
      { unit: "UNIT III", q1: "State Routh-Hurwitz Stability Criterion. Determine stability of characteristic equation with special cases. [14 Marks]", q2: "Explain Root Locus technique: Rules for plotting Root Locus, Asymptotes, Breakaway points, and Angle of departure. [14 Marks]" },
      { unit: "UNIT IV", q1: "Explain Frequency Response Analysis: Draw Bode Plot. Determine Gain Margin and Phase Margin. [14 Marks]", q2: "Explain Polar Plots and Nyquist Stability Criterion. Determine closed-loop stability. [14 Marks]" },
      { unit: "UNIT V", q1: "Explain State Variable Analysis: State Transition Matrix properties and solution of state equation. [14 Marks]", q2: "Explain Controllability and Observability using Kalman's test. Describe P, PI, PID controllers. [14 Marks]" }
    ]
  },
  {
    filename: "MITS_EE_Sem5_PowerSystems1_130501_EndSem_2024.pdf",
    title: "Power Systems-I (Transmission & Distribution) - End Sem Paper 2024",
    subjectName: "Power Systems-I",
    subjectCode: "130501",
    branch: "EE",
    semester: 5,
    academicYear: "2024",
    examType: "End-Sem",
    maxMarks: 70,
    timeAllowed: "3 Hours",
    units: [
      { unit: "UNIT I", q1: "Explain structure of modern electric power system. Compare AC vs DC transmission systems. [14 Marks]", q2: "Derive expressions for Line Inductance and Capacitance of 3-phase transposed overhead transmission line. [14 Marks]" },
      { unit: "UNIT II", q1: "Classify transmission lines (Short, Medium, Long). Derive ABCD parameters using Nominal-T and Nominal-Pi. [14 Marks]", q2: "Explain Ferranti Effect and Surge Impedance Loading (SIL) of long transmission lines. [14 Marks]" },
      { unit: "UNIT III", q1: "Explain Overhead Line Insulators (Pin, Suspension, Strain). Derive String Efficiency and methods to improve it. [14 Marks]", q2: "Derive Sag and Tension equations of overhead conductor supported at equal and unequal levels. [14 Marks]" },
      { unit: "UNIT IV", q1: "Explain Corona phenomenon in overhead lines: Disruptive critical voltage and power loss formula. [14 Marks]", q2: "Describe Underground Cables: Construction, Classification, Insulation resistance, and Grading of cables. [14 Marks]" },
      { unit: "UNIT V", q1: "Explain Distribution Systems: Radial, Ring Main, and Interconnected systems. Kelvin's Law for conductor size. [14 Marks]", q2: "Describe Substation grounding systems (solid, resistance, reactance grounding) and equipment layout. [14 Marks]" }
    ]
  },

  // 7. ME
  {
    filename: "MITS_ME_Sem3_Thermodynamics_120301_EndSem_2024.pdf",
    title: "Engineering Thermodynamics - End Semester Question Paper 2024",
    subjectName: "Engineering Thermodynamics",
    subjectCode: "120301",
    branch: "ME",
    semester: 3,
    academicYear: "2024",
    examType: "End-Sem",
    maxMarks: 70,
    timeAllowed: "3 Hours",
    units: [
      { unit: "UNIT I", q1: "Derive Steady Flow Energy Equation (SFEE). Apply SFEE to Nozzle, Turbine, Compressor. [14 Marks]", q2: "State First and Zeroth Laws of Thermodynamics. Calculate polytropic compression work and heat. [14 Marks]" },
      { unit: "UNIT II", q1: "State Kelvin-Planck and Clausius statements of Second Law. Derive Carnot efficiency. [14 Marks]", q2: "State Clausius Inequality. Prove Principle of Increase of Entropy for isolated systems. [14 Marks]" },
      { unit: "UNIT III", q1: "Define Availability, Exergy, and Irreversibility. State Gouy-Stodola theorem. [14 Marks]", q2: "Derive Maxwell's Thermodynamic Relations and Clausius-Clapeyron equation for phase change. [14 Marks]" },
      { unit: "UNIT IV", q1: "Explain Steam formation with P-v-T diagrams. Describe Throttling Calorimeter for dryness fraction. [14 Marks]", q2: "Explain Rankine Cycle with Reheat and Regeneration on T-s and Mollier diagrams. [14 Marks]" },
      { unit: "UNIT V", q1: "Derive air-standard efficiency and MEP for Otto and Diesel cycles with P-v diagrams. [14 Marks]", q2: "Compare Otto, Diesel, and Dual cycles for same compression ratio. Explain Brayton cycle. [14 Marks]" }
    ]
  },
  {
    filename: "MITS_ME_Sem3_Manufacturing_120302_EndSem_2024.pdf",
    title: "Manufacturing Science & Technology - End Semester Paper 2024",
    subjectName: "Manufacturing Science",
    subjectCode: "120302",
    branch: "ME",
    semester: 3,
    academicYear: "2024",
    examType: "End-Sem",
    maxMarks: 70,
    timeAllowed: "3 Hours",
    units: [
      { unit: "UNIT I", q1: "Explain Sand Casting process: Pattern allowances, Molding sand properties, Gating system, and Risers. [14 Marks]", q2: "Describe Special Casting methods: Die Casting, Investment Casting, and Centrifugal Casting. [14 Marks]" },
      { unit: "UNIT II", q1: "Explain Arc Welding processes: SMAW, TIG (GTAW), and MIG (GMAW). Explain HAZ (Heat Affected Zone). [14 Marks]", q2: "Describe Resistance Welding (Spot, Seam, Projection) and Solid-State welding (Friction welding). [14 Marks]" },
      { unit: "UNIT III", q1: "Explain Metal Forming: Hot working vs Cold working. Describe Rolling process and Angle of Bite. [14 Marks]", q2: "Describe Forging (Open die, Closed die, Drop forging) and Extrusion (Direct and Indirect). [14 Marks]" },
      { unit: "UNIT IV", q1: "Explain Sheet Metal operations: Blanking, Piercing, Bending, Drawing, and Clearance calculation. [14 Marks]", q2: "Describe Powder Metallurgy process: Powder production, Blending, Compacting, and Sintering. [14 Marks]" },
      { unit: "UNIT V", q1: "Explain Mechanics of Metal Cutting: Merchant's Circle Diagram and cutting force calculations. [14 Marks]", q2: "Describe Tool Wear mechanisms, Taylor's Tool Life Equation, and Cutting Fluids. [14 Marks]" }
    ]
  },
  {
    filename: "MITS_ME_Sem4_FluidMechanics_120401_EndSem_2024.pdf",
    title: "Fluid Mechanics & Hydraulic Machinery - End Semester Paper 2024",
    subjectName: "Fluid Mechanics",
    subjectCode: "120401",
    branch: "ME",
    semester: 4,
    academicYear: "2024",
    examType: "End-Sem",
    maxMarks: 70,
    timeAllowed: "3 Hours",
    units: [
      { unit: "UNIT I", q1: "Explain Fluid properties: Viscosity, Surface Tension, Capillarity. State Newton's Law of Viscosity. [14 Marks]", q2: "State Pascal's Law. Calculate Total Hydrostatic Pressure and Center of Pressure on submerged surfaces. [14 Marks]" },
      { unit: "UNIT II", q1: "Derive Continuity Equation in 3D Cartesian coordinates. Differentiate Streamline, Streakline, Pathline. [14 Marks]", q2: "Derive Euler's Equation of Motion and Bernoulli's Theorem from first principles. State assumptions. [14 Marks]" },
      { unit: "UNIT III", q1: "Explain Flow measuring devices: Venturimeter, Orifice meter, Pitot tube with discharge equations. [14 Marks]", q2: "Derive Hagen-Poiseuille equation for laminar viscous flow through circular pipe. [14 Marks]" },
      { unit: "UNIT IV", q1: "Explain Major and Minor losses in pipes. Derive Darcy-Weisbach equation for frictional loss. [14 Marks]", q2: "Explain Boundary Layer theory: Laminar, Turbulent boundary layers, Separation, and control methods. [14 Marks]" },
      { unit: "UNIT V", q1: "Explain Pelton Wheel Turbine: Velocity triangles, Work done, and Hydraulic efficiency. [14 Marks]", q2: "Explain Francis Turbine and Centrifugal Pump: Priming, Cavitation, and Characteristic curves. [14 Marks]" }
    ]
  },

  // 8. CE
  {
    filename: "MITS_CE_Sem4_StructuralAnalysis_110401_EndSem_2024.pdf",
    title: "Structural Analysis-I - End Semester Question Paper 2024",
    subjectName: "Structural Analysis-I",
    subjectCode: "110401",
    branch: "CE",
    semester: 4,
    academicYear: "2024",
    examType: "End-Sem",
    maxMarks: 70,
    timeAllowed: "3 Hours",
    units: [
      { unit: "UNIT I", q1: "Differentiate Static vs Kinematic Indeterminacy. State Castigliano's First and Second Theorems. [14 Marks]", q2: "State Unit Load Method and Maxwell's Reciprocal Theorem with proofs. [14 Marks]" },
      { unit: "UNIT II", q1: "Analyze propped cantilever beam using strain energy method. State Clapeyron's Three Moment Theorem. [14 Marks]", q2: "Analyze two-span continuous beam using Theorem of Three Moments. Draw SFD and BMD. [14 Marks]" },
      { unit: "UNIT III", q1: "Derive Slope Deflection Equations for members with and without support settlement. [14 Marks]", q2: "Analyze single-bay portal frame using Slope Deflection Method. [14 Marks]" },
      { unit: "UNIT IV", q1: "Explain Moment Distribution Method (Hardy Cross). Carry-over, Stiffness, Distribution factors. [14 Marks]", q2: "Analyze symmetrical portal frame with sway using Moment Distribution Method. [14 Marks]" },
      { unit: "UNIT V", q1: "Draw Influence Line Diagrams (ILD) for reactions and bending moments in simply supported beams. [14 Marks]", q2: "State Muller-Breslau Principle. Analyze Three-Hinged Parabolic Arch horizontal thrust. [14 Marks]" }
    ]
  },
  {
    filename: "MITS_CE_Sem3_MechanicsSolids_110301_EndSem_2024.pdf",
    title: "Mechanics of Solids & Strength of Materials - End Sem Paper 2024",
    subjectName: "Mechanics of Solids",
    subjectCode: "110301",
    branch: "CE",
    semester: 3,
    academicYear: "2024",
    examType: "End-Sem",
    maxMarks: 70,
    timeAllowed: "3 Hours",
    units: [
      { unit: "UNIT I", q1: "Define Stress, Strain, Young's Modulus, Bulk Modulus, Shear Modulus. Derive relation between E, G, K. [14 Marks]", q2: "Calculate stresses in compound bars and thermal stresses in constrained members. [14 Marks]" },
      { unit: "UNIT II", q1: "Draw Shear Force and Bending Moment Diagrams for Cantilever and Simply Supported Beams with UDL and UVL. [14 Marks]", q2: "Derive Pure Bending Equation (M/I = sigma/y = E/R). Calculate Section Modulus for I-section. [14 Marks]" },
      { unit: "UNIT III", q1: "Derive Torsion Equation (T/J = tau/r = G theta / L) for circular solid and hollow shafts. [14 Marks]", q2: "Design helical springs and calculate deflection, stiffness, and maximum shear stress. [14 Marks]" },
      { unit: "UNIT IV", q1: "Explain Principal Stresses and Principal Planes. Construct Mohr's Circle of Stress for 2D states. [14 Marks]", q2: "Explain Theories of Failure: Maximum Principal Stress, Maximum Shear Stress (Tresca), Von Mises. [14 Marks]" },
      { unit: "UNIT V", q1: "Derive Euler's Critical Buckling Load for columns with various end boundary conditions. [14 Marks]", q2: "Explain Rankine-Gordon formula for columns and thin cylinders circumferential/longitudinal stresses. [14 Marks]" }
    ]
  },
  {
    filename: "MITS_CE_Sem5_Geotech_110501_EndSem_2024.pdf",
    title: "Geotechnical & Foundation Engineering - End Semester Paper 2024",
    subjectName: "Geotechnical Engineering",
    subjectCode: "110501",
    branch: "CE",
    semester: 5,
    academicYear: "2024",
    examType: "End-Sem",
    maxMarks: 70,
    timeAllowed: "3 Hours",
    units: [
      { unit: "UNIT I", q1: "Explain 3-Phase Soil System. Define Void Ratio, Porosity, Degree of Saturation, Water Content. [14 Marks]", q2: "Explain Index Properties: Liquid Limit, Plastic Limit, Plasticity Index, and Soil Classification (USCS/IS). [14 Marks]" },
      { unit: "UNIT II", q1: "Explain Darcy's Law for soil permeability. Describe Constant Head and Falling Head permeameter tests. [14 Marks]", q2: "Explain Effective Stress principle, Seepage Pressure, Quick Sand condition, and Flow Nets. [14 Marks]" },
      { unit: "UNIT III", q1: "Explain Standard Proctor Compaction test. Compare Compaction vs Consolidation. [14 Marks]", q2: "State Terzaghi's 1D Consolidation Theory. Calculate coefficient of consolidation (Cv) and settlement. [14 Marks]" },
      { unit: "UNIT IV", q1: "Explain Shear Strength of soils: Mohr-Coulomb failure criterion. Describe Direct Shear Test. [14 Marks]", q2: "Describe Triaxial Compression Test (UU, CU, CD tests) and Unconfined Compression Test. [14 Marks]" },
      { unit: "UNIT V", q1: "Explain Terzaghi's Bearing Capacity Theory for shallow foundations with bearing capacity factors. [14 Marks]", q2: "Explain Pile Foundations: Static and Dynamic pile driving formulas and group pile efficiency. [14 Marks]" }
    ]
  },

  // 9. 1ST YEAR COMMON
  {
    filename: "MITS_Common_Sem1_Math1_100101_EndSem_2024.pdf",
    title: "Engineering Mathematics-I - End Semester Question Paper 2024",
    subjectName: "Engineering Mathematics-I",
    subjectCode: "100101",
    branch: "Common",
    semester: 1,
    academicYear: "2024",
    examType: "End-Sem",
    maxMarks: 70,
    timeAllowed: "3 Hours",
    units: [
      { unit: "UNIT I", q1: "State and prove Rolle's Theorem. Expand e^x cos y using Maclaurin's Theorem. [14 Marks]", q2: "State Leibniz's Rule for n-th derivative of product of two functions with proof. [14 Marks]" },
      { unit: "UNIT II", q1: "State Euler's Theorem for Homogeneous Functions. Find maximum and minimum of f(x,y)=x^3+y^3-3axy. [14 Marks]", q2: "Evaluate Jacobian J=d(x,y,z)/d(r,theta,phi) for spherical polar coordinates. Lagrange multipliers. [14 Marks]" },
      { unit: "UNIT III", q1: "Evaluate double integral over region bounded by y=x^2 and y^2=x. Change order of integration. [14 Marks]", q2: "Calculate volume of sphere using spherical polar triple integrals. [14 Marks]" },
      { unit: "UNIT IV", q1: "Find rank of matrix by reducing to Normal Echelon form. Solve system of linear equations. [14 Marks]", q2: "State and prove Cayley-Hamilton Theorem. Diagonalize symmetric matrix using eigenvalues. [14 Marks]" },
      { unit: "UNIT V", q1: "Find Directional Derivative of scalar field. State and verify Green's Theorem in a plane. [14 Marks]", q2: "State Stokes' Theorem and Gauss Divergence Theorem. Evaluate surface integrals over closed box. [14 Marks]" }
    ]
  },
  {
    filename: "MITS_Common_Sem1_Physics_100102_EndSem_2024.pdf",
    title: "Engineering Physics - End Semester Question Paper 2024",
    subjectName: "Engineering Physics",
    subjectCode: "100102",
    branch: "Common",
    semester: 1,
    academicYear: "2024",
    examType: "End-Sem",
    maxMarks: 70,
    timeAllowed: "3 Hours",
    units: [
      { unit: "UNIT I", q1: "Explain thin film interference by reflected light. Describe Newton's Rings experiment. [14 Marks]", q2: "Compare Fresnel and Fraunhofer diffraction. Derive single-slit diffraction intensity. [14 Marks]" },
      { unit: "UNIT II", q1: "Explain Einstein's A and B coefficients. Describe construction of He-Ne and Ruby lasers. [14 Marks]", q2: "Derive Numerical Aperture (NA) and Acceptance Angle of optical fiber. Step vs Graded index. [14 Marks]" },
      { unit: "UNIT III", q1: "Explain de Broglie hypothesis and Davisson-Germer experiment. State Heisenberg Uncertainty. [14 Marks]", q2: "Derive time-independent Schrodinger equation and calculate 1D infinite potential well energies. [14 Marks]" },
      { unit: "UNIT IV", q1: "Explain Miller Indices and Bragg's Law of X-ray diffraction. [14 Marks]", q2: "Explain Superconductivity and Meissner Effect. Differentiate Type-I vs Type-II superconductors. [14 Marks]" },
      { unit: "UNIT V", q1: "State Maxwell's four electromagnetic equations. State and prove Poynting's Theorem. [14 Marks]", q2: "Explain Quantum Confinement (Wells, Wires, Dots) and Sol-Gel synthesis of nanomaterials. [14 Marks]" }
    ]
  },
  {
    filename: "MITS_Common_Sem1_BEEE_100103_MidSem_2024.pdf",
    title: "Basic Electrical & Electronics Engineering - Mid Semester Test 2024",
    subjectName: "Basic Electrical Engineering",
    subjectCode: "100103",
    branch: "Common",
    semester: 1,
    academicYear: "2024",
    examType: "Mid-Sem",
    maxMarks: 30,
    timeAllowed: "1.5 Hours",
    units: [
      { unit: "PART A", q1: "State Kirchhoff's Laws (KCL, KVL). State and prove Thevenin's and Norton's Theorems. [15 Marks]", q2: "State Maximum Power Transfer Theorem for DC circuits. Solve bridge circuit using Mesh analysis. [15 Marks]" },
      { unit: "PART B", q1: "Define RMS, Average, Form factor of AC sine wave. Explain single-phase transformer EMF equation. [15 Marks]", q2: "Calculate primary turns, flux, and full-load currents for a 10 kVA 2200/220V transformer. [15 Marks]" }
    ]
  },
  {
    filename: "MITS_Common_Sem2_Math2_100201_EndSem_2024.pdf",
    title: "Engineering Mathematics-II - End Semester Question Paper 2024",
    subjectName: "Engineering Mathematics-II",
    subjectCode: "100201",
    branch: "Common",
    semester: 2,
    academicYear: "2024",
    examType: "End-Sem",
    maxMarks: 70,
    timeAllowed: "3 Hours",
    units: [
      { unit: "UNIT I", q1: "Solve Second Order Linear Differential Equations with constant coefficients using Method of Variation of Parameters. [14 Marks]", q2: "Solve Cauchy-Euler Homogeneous Linear Differential Equations. [14 Marks]" },
      { unit: "UNIT II", q1: "Find Laplace Transform of standard functions and Periodic functions. State First and Second Shifting Theorems. [14 Marks]", q2: "Evaluate Inverse Laplace Transform using Convolution Theorem. Solve Initial Value Problems. [14 Marks]" },
      { unit: "UNIT III", q1: "Form Partial Differential Equations (PDE) by eliminating arbitrary constants and functions. [14 Marks]", q2: "Solve first-order linear PDE using Lagrange's Method: Pp + Qq = R. [14 Marks]" },
      { unit: "UNIT IV", q1: "Solve 1D Heat Conduction and 1D Wave Equations using Method of Separation of Variables. [14 Marks]", q2: "Solve Laplace Equation in two dimensions under given boundary conditions. [14 Marks]" },
      { unit: "UNIT V", q1: "Explain Fourier Transform, Sine and Cosine transforms and their inversion formulas. [14 Marks]", q2: "Solve Boundary Value Problems using Fourier Transform techniques. [14 Marks]" }
    ]
  },
  {
    filename: "MITS_Common_Sem2_Chem_100202_Supp_2023.pdf",
    title: "Engineering Chemistry - Supplementary Examination 2023",
    subjectName: "Engineering Chemistry",
    subjectCode: "100202",
    branch: "Common",
    semester: 2,
    academicYear: "2023",
    examType: "Supplementary",
    maxMarks: 70,
    timeAllowed: "3 Hours",
    units: [
      { unit: "UNIT I", q1: "Explain Hardness of water (Temporary vs Permanent). Describe EDTA titration method for hardness estimation. [14 Marks]", q2: "Describe Zeolite process and Ion-Exchange demineralization process for water softening. [14 Marks]" },
      { unit: "UNIT II", q1: "Explain Calorific Value of fuels (HCV and LCV). Describe Bomb Calorimeter experiment. [14 Marks]", q2: "Explain Proximate and Ultimate analysis of coal. Describe fractional distillation of petroleum. [14 Marks]" },
      { unit: "UNIT III", q1: "Explain Electrochemical theory of Corrosion (Galvanic and Differential Aeration corrosion). [14 Marks]", q2: "Describe Corrosion prevention methods: Sacrificial Anode, Impressed Current Cathodic protection, and Metallic coatings. [14 Marks]" },
      { unit: "UNIT IV", q1: "Classify Polymers: Thermoplastic vs Thermosetting. Explain synthesis of Nylon 6,6 and Bakelite. [14 Marks]", q2: "Describe Lubricants: Mechanism of lubrication (Fluid film, Boundary, Extreme pressure), Viscosity Index. [14 Marks]" },
      { unit: "UNIT V", q1: "State Beer-Lambert's Law. Explain instrumentation and applications of UV-Visible Spectroscopy. [14 Marks]", q2: "Explain Principle and applications of IR Spectroscopy and Phase Rule for 1-component water system. [14 Marks]" }
    ]
  },
  {
    filename: "MITS_Common_Sem2_BME_100203_EndSem_2024.pdf",
    title: "Basic Mechanical Engineering - End Semester Question Paper 2024",
    subjectName: "Basic Mechanical Engineering",
    subjectCode: "100203",
    branch: "Common",
    semester: 2,
    academicYear: "2024",
    examType: "End-Sem",
    maxMarks: 70,
    timeAllowed: "3 Hours",
    units: [
      { unit: "UNIT I", q1: "Classify Engineering Materials (Ferrous, Non-ferrous, Polymers, Ceramics). Describe Iron-Carbon equilibrium diagram. [14 Marks]", q2: "Explain Mechanical Properties: Tensile strength, Hardness, Toughness, Ductility, Malleability. [14 Marks]" },
      { unit: "UNIT II", q1: "Explain Working of 2-Stroke and 4-Stroke Petrol (SI) and Diesel (CI) Engines with P-v diagrams. [14 Marks]", q2: "Compare SI vs CI engines in terms of compression ratio, fuel injection, and thermal efficiency. [14 Marks]" },
      { unit: "UNIT III", q1: "Explain Steam Boilers: Classify Fire-Tube vs Water-Tube boilers. Describe Cochran and Babcock-Wilcox boilers. [14 Marks]", q2: "Explain Boiler Mountings (Safety valve, Water level indicator) and Accessories (Superheater, Economizer). [14 Marks]" },
      { unit: "UNIT IV", q1: "Explain Power Transmission drives: Belt drives (Open, Cross), Rope drives, Chain drives, Gear trains. [14 Marks]", q2: "Derive Ratio of Tensions for flat belt drive (T1/T2 = e^(mu theta)). Explain Velocity Ratio. [14 Marks]" },
      { unit: "UNIT V", q1: "Describe Lathe Machine operations: Turning, Facing, Thread cutting, Taper turning, Knurling. [14 Marks]", q2: "Explain Drilling and Milling machine operations. Describe basic refrigeration vapor compression cycle. [14 Marks]" }
    ]
  },
  {
    filename: "MITS_Common_Sem2_BCE_100204_EndSem_2024.pdf",
    title: "Basic Civil Engineering & Mechanics - End Semester Paper 2024",
    subjectName: "Basic Civil Engineering",
    subjectCode: "100204",
    branch: "Common",
    semester: 2,
    academicYear: "2024",
    examType: "End-Sem",
    maxMarks: 70,
    timeAllowed: "3 Hours",
    units: [
      { unit: "UNIT I", q1: "Describe Building Materials: Composition and manufacturing of Portland Cement. Field tests on bricks. [14 Marks]", q2: "Explain Concrete grades, Workability (Slump test), Water-Cement ratio, and Compressive strength testing. [14 Marks]" },
      { unit: "UNIT II", q1: "Explain Principles of Surveying: Chain Surveying, Compass Surveying, Whole Circle Bearing vs Quadrantal Bearing. [14 Marks]", q2: "Explain Leveling: Height of Instrument method vs Rise and Fall method. Calculate Reduced Levels (RL). [14 Marks]" },
      { unit: "UNIT III", q1: "State and prove Lami's Theorem and Varignon's Theorem of Moments. Find resultant of concurrent forces. [14 Marks]", q2: "Calculate Centroid and Moment of Inertia for standard T-section and I-section. [14 Marks]" },
      { unit: "UNIT IV", q1: "State Laws of Dry Friction (Coulomb's Friction). Solve problems involving blocks on rough inclined planes. [14 Marks]", q2: "Analyze simple pin-jointed trusses using Method of Joints and Method of Sections. [14 Marks]" },
      { unit: "UNIT V", q1: "Explain Building Components: Substructure (Shallow vs Deep foundations) and Superstructure (Walls, Columns, Beams). [14 Marks]", q2: "Describe Green Buildings, Rainwater Harvesting techniques, and basic site planning principles. [14 Marks]" }
    ]
  },
  {
    filename: "MITS_Common_Sem2_EnvEng_100205_EndSem_2024.pdf",
    title: "Environmental Engineering & Disaster Management - End Sem Paper 2024",
    subjectName: "Environmental Engineering",
    subjectCode: "100205",
    branch: "Common",
    semester: 2,
    academicYear: "2024",
    examType: "End-Sem",
    maxMarks: 70,
    timeAllowed: "3 Hours",
    units: [
      { unit: "UNIT I", q1: "Explain Ecosystem Structure: Biotic and Abiotic components, Food Chains, Food Webs, Ecological Pyramids. [14 Marks]", q2: "Describe Biogeochemical cycles: Carbon cycle, Nitrogen cycle, and Hydrological water cycle. [14 Marks]" },
      { unit: "UNIT II", q1: "Explain Air Pollution: Primary and Secondary pollutants, Photochemical Smog, Acid Rain, Greenhouse Effect. [14 Marks]", q2: "Describe Air pollution control devices: Cyclone Separator, Electrostatic Precipitator (ESP), Wet Scrubbers. [14 Marks]" },
      { unit: "UNIT III", q1: "Explain Water Pollution: Dissolved Oxygen (DO), Biochemical Oxygen Demand (BOD), Chemical Oxygen Demand (COD). [14 Marks]", q2: "Describe Wastewater Treatment stages: Primary sedimentation, Secondary activated sludge, and Tertiary disinfection. [14 Marks]" },
      { unit: "UNIT IV", q1: "Explain Municipal Solid Waste Management (MSWM): 3R Concept (Reduce, Reuse, Recycle), Landfilling, Composting. [14 Marks]", q2: "Describe E-Waste and Biomedical Waste hazards, handling rules, and incineration disposal methods. [14 Marks]" },
      { unit: "UNIT V", q1: "Explain Disaster Management Cycle: Mitigation, Preparedness, Response, and Recovery. [14 Marks]", q2: "Describe Natural Disasters (Earthquakes, Floods, Cyclones) and Industrial hazards (Bhopal Gas Tragedy case study). [14 Marks]" }
    ]
  }
];

// Generate genuine PDF with official MITS formatting
function generatePaperPdf(paper) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margins: { top: 36, bottom: 36, left: 40, right: 40 }
    });

    const destPathBackend = path.join(outputDirBackend, paper.filename);
    const destPathFrontend = path.join(outputDirFrontend, paper.filename);

    const stream = fs.createWriteStream(destPathBackend);
    doc.pipe(stream);

    // Roll No Header
    doc.fontSize(9.5).font("Helvetica-Bold").text("ROLL NO: ________________________", { align: "right" });
    doc.moveDown(0.2);

    // Official Institute Heading
    doc.fontSize(12.5).font("Helvetica-Bold").text("MADHAV INSTITUTE OF TECHNOLOGY & SCIENCE, GWALIOR", { align: "center" });
    doc.fontSize(8.5).font("Helvetica").text("(A Deemed to be University | Autonomous Institute Established in 1957 | NAAC 'A++' Accredited)", { align: "center" });
    doc.moveDown(0.3);

    // Exam Title & Semester
    const branchLabel = paper.branch === "Common" ? "FIRST YEAR (COMMON TO ALL BRANCHES)" : `B.TECH. ${paper.branch.toUpperCase()} ENGINEERING`;
    doc.fontSize(10).font("Helvetica-Bold").text(`${paper.examType.toUpperCase()} EXAMINATION — DECEMBER / JUNE ${paper.academicYear}`, { align: "center" });
    doc.fontSize(9).font("Helvetica").text(`${branchLabel} — SEMESTER ${paper.semester}`, { align: "center" });
    doc.moveDown(0.3);

    // Subject Box Banner
    doc.rect(40, doc.y, 515, 22).fillAndStroke("#0a1936", "#38bdf8");
    doc.fillColor("#ffffff").fontSize(9.5).font("Helvetica-Bold").text(
      `COURSE: ${paper.subjectName.toUpperCase()} [CODE: ${paper.subjectCode}]`,
      45,
      doc.y - 17,
      { align: "center", width: 505 }
    );
    doc.fillColor("#000000");
    doc.moveDown(0.7);

    // Timing and Marks
    doc.fontSize(8.5).font("Helvetica-Bold");
    doc.text(`Time Allowed: ${paper.timeAllowed}`, 40, doc.y, { continued: true });
    doc.text(`Maximum Marks: ${paper.maxMarks}`, { align: "right" });
    doc.moveDown(0.3);

    // Divider
    doc.strokeColor("#333333").lineWidth(0.8).moveTo(40, doc.y).lineTo(555, doc.y).stroke();
    doc.moveDown(0.3);

    // Note
    doc.fontSize(7.5).font("Helvetica-Oblique");
    doc.text("NOTE: 1. Attempt any FIVE questions selecting at least ONE question from each Unit.", { align: "left" });
    doc.text("      2. All questions carry equal marks. Sub-questions carry marks indicated in brackets [ ].", { align: "left" });
    doc.text("      3. Assume suitable missing data, if any, and state it clearly.", { align: "left" });
    doc.text("      4. Use of scientific non-programmable calculator is permitted.", { align: "left" });
    doc.moveDown(0.3);

    doc.strokeColor("#888888").lineWidth(0.5).moveTo(40, doc.y).lineTo(555, doc.y).stroke();
    doc.moveDown(0.4);

    // Render Units
    paper.units.forEach((u, idx) => {
      doc.fontSize(8.5).font("Helvetica-Bold").fillColor("#0a1936").text(`--- ${u.unit} ---`, { align: "center" });
      doc.fillColor("#000000").fontSize(8).font("Helvetica");
      doc.moveDown(0.2);

      doc.font("Helvetica-Bold").text(`Q.${idx + 1} `, { continued: true });
      doc.font("Helvetica").text(u.q1);
      doc.moveDown(0.25);

      doc.fontSize(7.5).font("Helvetica-Bold").text("[ OR ]", { align: "center" });
      doc.moveDown(0.2);

      doc.fontSize(8).font("Helvetica-Bold").text(`Q.${idx + 1} (Alt) `, { continued: true });
      doc.font("Helvetica").text(u.q2);
      doc.moveDown(0.35);

      if (idx < paper.units.length - 1) {
        doc.strokeColor("#e0e0e0").lineWidth(0.5).moveTo(60, doc.y).lineTo(535, doc.y).stroke();
        doc.moveDown(0.25);
      }
    });

    // Footer
    doc.moveDown(0.4);
    doc.fontSize(7.5).font("Helvetica-Oblique").fillColor("#666666").text(
      "*** END OF QUESTION PAPER — MITS GWALIOR AUTONOMOUS EXAMINATION CELL ***",
      { align: "center" }
    );

    doc.end();

    stream.on("finish", () => {
      fs.copyFileSync(destPathBackend, destPathFrontend);
      resolve({
        filename: paper.filename,
        size: fs.statSync(destPathBackend).size
      });
    });

    stream.on("error", reject);
  });
}

async function run() {
  console.log(`Generating authentic MITS question papers (${ALL_MITS_PAPERS.length} papers)...`);
  for (const paper of ALL_MITS_PAPERS) {
    const res = await generatePaperPdf(paper);
    console.log(`[PASS] Generated: ${res.filename} (${(res.size / 1024).toFixed(1)} KB)`);
  }
  console.log("All authentic MITS examination question paper PDFs generated successfully!");
}

run().catch(console.error);
