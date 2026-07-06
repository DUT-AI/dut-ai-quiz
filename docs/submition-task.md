flowchart TB
    %% ================= CLIENT =================
    subgraph Client["Tầng Client / Frontend"]
        Admin((Admin / Ban tổ chức))
        User((Thí sinh / Đội thi))
        LeaderboardUI["Leaderboard UI<br/>Live Submission Graph"]
    end

    %% ================= CORE API =================
    subgraph CoreAPI["Core API Service - FastAPI"]
        API_Gateway["API Gateway<br/>Router & API Endpoints"]
        CompetitionAPI["Competition / Team / Task API<br/>CRUD cuộc thi, đội, bài tập"]
        RateLimiter["Rate Limiting Validator<br/>Quota / Cooldown"]
        SubReceiver["Submission Receiver<br/>Nhận script + model"]
        LogCancelAPI["Logs / Cancel API<br/>Xem lỗi / hủy submission"]
        WS["WebSocket Manager<br/>Leaderboard / Live Graph"]
    end

    %% ================= DATA STORAGE =================
    subgraph DataStorage["Tầng Dữ Liệu & Lưu Trữ"]
        Storage[(MinIO / S3<br/>Script, Model, Dataset<br/>predict.csv, Logs)]
        DB[(PostgreSQL<br/>Competition, Team, Task<br/>Submission, Score)]
        Cache[(Redis<br/>Rate Limit, Queue<br/>Pub/Sub)]
        GT[(Restricted Ground Truth<br/>Evaluator Only)]
    end

    %% ================= WORKER =================
    subgraph WorkerService["Execution Engine - Background Worker"]
        Consumer["Queue Consumer"]
        Orchestrator["Sandbox Orchestrator"]

        subgraph Environment["Môi trường Cách ly"]
            Docker["Docker Container Sandbox<br/>Network: None<br/>RAM / CPU / GPU Limit<br/>Timeout"]
        end

        PredictFile["Output<br/>predict.csv"]
        Evaluator["Internal Metric Evaluator<br/>RMSE / F1 / Accuracy"]
    end

    %% ================= ADMIN FLOW =================
    Admin -- "A1. Tạo cuộc thi / bài tập / metric" --> API_Gateway
    API_Gateway --> CompetitionAPI
    CompetitionAPI -- "Lưu competition, task, metric_type" --> DB
    CompetitionAPI -- "Lưu public/private dataset link" --> Storage

    %% ================= SUBMISSION FLOW =================
    User -- "1. Nộp bài: script + model" --> API_Gateway
    API_Gateway --> SubReceiver

    SubReceiver -- "Kiểm tra cuộc thi, đội, bài tập" --> CompetitionAPI
    SubReceiver -- "Kiểm tra Quota / Cooldown" --> RateLimiter
    RateLimiter <--> Cache
    RateLimiter -- "Không hợp lệ thì reject" --> User

    SubReceiver -- "2. Lưu file an toàn" --> Storage
    SubReceiver -- "3. Ghi status Uploading / Queued" --> DB
    SubReceiver -- "4. Đẩy job vào hàng đợi" --> Cache

    %% ================= WORKER FLOW =================
    Cache -- "5. Queue Consumer kéo job mới" --> Consumer
    Consumer --> Orchestrator

    Orchestrator -- "Tải script + model + hidden input" --> Storage
    Orchestrator -- "6. Khởi tạo sandbox cô lập" --> Docker

    Docker -- "Chạy code không Internet<br/>có timeout + resource limit" --> Docker
    Docker -- "Chỉ sinh file dự đoán" --> PredictFile
    PredictFile -- "Lưu predict.csv" --> Storage

    %% ================= EVALUATION FLOW =================
    Storage -- "7a. Evaluator đọc predict.csv" --> Evaluator
    GT -- "7b. Evaluator đọc Ground Truth nội bộ" --> Evaluator
    Evaluator -- "Tính điểm theo metric_type" --> Evaluator
    Evaluator -- "7c. Cập nhật score, inference_time, status" --> DB
    Evaluator -- "7d. Publish event tính xong" --> Cache

    %% ================= LEADERBOARD FLOW =================
    Cache -- "Pub/Sub event" --> WS
    DB -- "Đọc best score từng task" --> WS
    WS -. "8. Cập nhật BXH real-time / live graph" .-> LeaderboardUI
    LeaderboardUI -. "Hiển thị cho thí sinh" .-> User

    %% ================= LOG / CANCEL FLOW =================
    User -- "C1. Xem lỗi / hủy submission" --> LogCancelAPI
    LogCancelAPI -- "Đọc log đã giới hạn dòng" --> Storage
    LogCancelAPI -- "Nếu đang chạy thì kill container" --> Docker
    LogCancelAPI -- "Mark Cancelled, không trừ quota" --> DB

    %% ================= SECURITY NOTE =================
    GT -. "Không mount vào Docker Sandbox" .-> Evaluator
    Docker -. "Không được đọc Ground Truth" .-> GT

    %% ================= STYLE =================
    classDef client fill:#f3e8ff,stroke:#7c3aed,stroke-width:2px,color:#2e1065,font-weight:bold;
    classDef api fill:#e3f2fd,stroke:#2563eb,stroke-width:2px,color:#172554,font-weight:bold;
    classDef database fill:#f9f0ff,stroke:#9333ea,stroke-width:2px,color:#581c87,font-weight:bold;
    classDef worker fill:#fff7ed,stroke:#f97316,stroke-width:2px,color:#7c2d12,font-weight:bold;
    classDef sandbox fill:#dcfce7,stroke:#16a34a,stroke-width:2px,color:#064e3b,font-weight:bold;
    classDef danger fill:#fee2e2,stroke:#dc2626,stroke-width:3px,color:#7f1d1d,font-weight:bold;

    class Admin,User,LeaderboardUI client;
    class API_Gateway,CompetitionAPI,RateLimiter,SubReceiver,LogCancelAPI,WS api;
    class Storage,DB,Cache database;
    class Consumer,Orchestrator,Evaluator,PredictFile worker;
    class Docker sandbox;
    class GT danger;