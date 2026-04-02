import base64
s = "rediss://default:gQAAAAAAAVxdAAIncDEyNmQxOGEzMDJlNWQ0ZTkzOWE0ODNkZmRjYzk3YWJlY3AxODkxODE@liked-grub-89181.upstash.io:6379"
print(base64.b64encode(s.encode()).decode())
