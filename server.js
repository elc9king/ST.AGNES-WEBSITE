const http = require("http");
const fs = require("fs");
const path = require("path");
const os = require("os");

const PORT = 3000;
const HOST = "0.0.0.0";

const ROOT = __dirname;

const MIME_TYPES = {
    ".html": "text/html; charset=UTF-8",
    ".css": "text/css; charset=UTF-8",
    ".js": "application/javascript; charset=UTF-8",
    ".json": "application/json; charset=UTF-8",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
    ".gif": "image/gif",
    ".svg": "image/svg+xml",
    ".ico": "image/x-icon",
    ".txt": "text/plain; charset=UTF-8"
};

/* =========================================
   FIND LOCAL NETWORK IP
========================================= */

function getLocalIP() {
    const interfaces = os.networkInterfaces();

    for (const name of Object.keys(interfaces)) {
        for (const network of interfaces[name]) {
            if (
                network.family === "IPv4" &&
                !network.internal
            ) {
                return network.address;
            }
        }
    }

    return "YOUR-PC-IP";
}

/* =========================================
   CREATE SERVER
========================================= */

const server = http.createServer((req, res) => {

    let requestedPath;

    try {
        requestedPath = decodeURIComponent(
            req.url.split("?")[0]
        );
    } catch {
        res.writeHead(400, {
            "Content-Type": "text/plain; charset=UTF-8"
        });

        res.end("400 - Bad Request");
        return;
    }

    /* Homepage */

    if (requestedPath === "/") {
        requestedPath = "/index.html";
    }

    /* Remove trailing slash */

    if (
        requestedPath.length > 1 &&
        requestedPath.endsWith("/")
    ) {
        requestedPath = requestedPath.slice(0, -1);
    }

    /* =========================================
       SECURITY
    ========================================= */

    const filePath = path.normalize(
        path.join(ROOT, requestedPath)
    );

    const relativePath = path.relative(
        ROOT,
        filePath
    );

    if (
        relativePath.startsWith("..") ||
        path.isAbsolute(relativePath)
    ) {
        res.writeHead(403, {
            "Content-Type": "text/plain; charset=UTF-8"
        });

        res.end("403 - Forbidden");
        return;
    }

    /* =========================================
       CHECK FILE
    ========================================= */

    fs.stat(filePath, (error, stats) => {

        if (error) {

            res.writeHead(404, {
                "Content-Type": "text/html; charset=UTF-8"
            });

            res.end(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>404 - St. Agnes Educational Centre</title>

    <style>
        body {
            margin: 0;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: Arial, sans-serif;
            background: #faf8f3;
            color: #17231d;
            text-align: center;
        }

        .error {
            max-width: 500px;
            padding: 40px;
        }

        h1 {
            font-size: 80px;
            margin: 0;
            color: #0f4c2f;
        }

        h2 {
            margin: 10px 0;
        }

        p {
            color: #66736c;
        }

        a {
            display: inline-block;
            margin-top: 20px;
            padding: 12px 22px;
            background: #0f4c2f;
            color: white;
            text-decoration: none;
            border-radius: 10px;
        }
    </style>
</head>

<body>

    <div class="error">

        <h1>404</h1>

        <h2>Page not found</h2>

        <p>
            The page you're looking for doesn't exist.
        </p>

        <a href="/">
            Return Home
        </a>

    </div>

</body>
</html>
            `);

            return;
        }

        /* =========================================
           BLOCK DIRECTORY ACCESS
        ========================================= */

        if (stats.isDirectory()) {

            res.writeHead(403, {
                "Content-Type": "text/plain; charset=UTF-8"
            });

            res.end(
                "403 - Directory access is not allowed"
            );

            return;
        }

        /* =========================================
           GET FILE TYPE
        ========================================= */

        const extension = path
            .extname(filePath)
            .toLowerCase();

        const contentType =
            MIME_TYPES[extension] ||
            "application/octet-stream";

        /* =========================================
           READ FILE
        ========================================= */

        fs.readFile(filePath, (error, data) => {

            if (error) {

                console.error(
                    `Error reading file: ${filePath}`
                );

                res.writeHead(500, {
                    "Content-Type":
                        "text/plain; charset=UTF-8"
                });

                res.end(
                    "500 - Internal Server Error"
                );

                return;
            }

            res.writeHead(200, {
                "Content-Type": contentType,
                "Cache-Control": "no-cache"
            });

            res.end(data);
        });
    });
});

/* =========================================
   SERVER ERROR HANDLING
========================================= */

server.on("error", (error) => {

    if (error.code === "EADDRINUSE") {

        console.error("");
        console.error(
            `❌ Port ${PORT} is already being used.`
        );
        console.error(
            "Try stopping the other server or change the port."
        );
        console.error("");

        return;
    }

    console.error(
        "❌ Server error:",
        error
    );
});

/* =========================================
   START SERVER
========================================= */

server.listen(PORT, HOST, () => {

    const localIP = getLocalIP();

    console.log("");
    console.log("==============================================");
    console.log("       ST. AGNES EDUCATIONAL CENTRE");
    console.log("==============================================");
    console.log("");

    console.log("🌐 Website server is running!");
    console.log("");

    console.log(
        `💻 Local:   http://localhost:${PORT}`
    );

    console.log(
        `📱 Network: http://${localIP}:${PORT}`
    );

    console.log("");

    console.log(
        "📡 Devices on the same Wi-Fi can open the Network URL."
    );

    console.log("");

    console.log("Press CTRL + C to stop the server.");
    console.log("");
});