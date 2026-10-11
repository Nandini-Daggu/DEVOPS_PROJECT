# ─────────────────────────────────────────────
# QuizGen AI – Frontend Dockerfile
# Serves static HTML/CSS/JS via nginx
# ─────────────────────────────────────────────

FROM nginx:1.25-alpine

# Remove the default nginx welcome page
RUN rm -rf /usr/share/nginx/html/*

# Copy all static frontend files
COPY index.html  /usr/share/nginx/html/
COPY styles.css  /usr/share/nginx/html/
COPY app.js      /usr/share/nginx/html/
COPY pptx-parser.js /usr/share/nginx/html/

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80 (mapped to 8080 on host in docker-compose)
EXPOSE 80
