# Imagen base con Python 3.10
FROM python:3.10-slim

# Instalar dependencias del sistema
RUN apt-get update && apt-get install -y \
    g++ \
    make \
    nodejs \
    npm \
    && rm -rf /var/lib/apt/lists/*

# Crear directorio de trabajo
WORKDIR /app

# 1. Copy only files needed for C++ compilation
COPY eigen-3.4.0 ./eigen-3.4.0
COPY Makefile ./
COPY exponents ./exponents

# 2. Compile C++ library (cacheable separately)
RUN make clean && make

# 3. Install Python dependencies
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# 4. Copy everything else (including frontend)
COPY . .

# Exponer el puerto correcto
EXPOSE 80

# Comando para iniciar FastAPI
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]