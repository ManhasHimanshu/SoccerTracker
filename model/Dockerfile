# Start from AWS's official PyTorch container - it has CUDA, Python, and PyTorch pre-installed
FROM 763104351884.dkr.ecr.us-east-1.amazonaws.com/pytorch-inference:2.5.1-cpu-py311-ubuntu22.04-sagemaker

# Set the working directory inside the container
WORKDIR /opt/program

# Copy your requirements file into the container
COPY requirements.txt .

# Install all Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy your inference code into the container
COPY src/inference.py .

# Tell SageMaker where to find the inference script
ENV SAGEMAKER_PROGRAM=inference.py

# Tell SageMaker to serve the model (not train it)
ENV SAGEMAKER_SERVE_MODULE_NAME=inference