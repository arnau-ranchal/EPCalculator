# Imagen base con Python 3.10
FROM python:3.10-slim

# Instalar dependencias del sistema (usando paquetes MariaDB)
RUN apt-get update && apt-get install -y \
    g++ \
    make \
    nodejs \
    npm \
    default-libmysqlclient-dev \
    && rm -rf /var/lib/apt/lists/*

# Crear directorio de trabajo
WORKDIR /app

# 1. Copy only files needed for C++ compilation
COPY eigen-3.4.0 ./eigen-3.4.0
COPY Makefile ./
COPY exponents ./exponents

# 2. Compile C++ library with MariaDB/MySQL compatibility
RUN make clean && make

# 3. Install Python dependencies
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# 4. Copy everything else (including frontend)
COPY . .

# Add MySQL connection wait script
RUN echo "#!/bin/bash\n" \
         "set -e\n\n" \
         "if [ -n \"\$MYSQL_HOST\" ]; then\n" \
         "  echo \"Waiting for MySQL at \$MYSQL_HOST...\"\n" \
         "  while ! mysqladmin ping -h\"\$MYSQL_HOST\" -u\"\$MYSQL_USER\" -p\"\$MYSQL_PASSWORD\" --silent; do\n" \
         "    sleep 1\n" \
         "  done\n" \
         "  echo \"MySQL is ready!\"\n" \
         "fi\n" \
         "exec \"\$@\"" > /entrypoint.sh \
    && chmod +x /entrypoint.sh

# Exponer el puerto correcto
EXPOSE 8000

# Entrypoint to wait for MySQL and start app
ENTRYPOINT ["/entrypoint.sh"]
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]