# indexer

directory indexer

## nginx

```
server {
    listen 80;
    listen [::]:80;
    root /path/to/your/root;
    server_name example.com;

    location ~* (.*)\/$ {
        proxy_pass http://127.0.0.1:8888;
    }

    location / {
        try_files $uri $uri/ =404;
    }
}
```
