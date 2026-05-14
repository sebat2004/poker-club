terraform {
  required_version = ">= 1.6.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"]

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-arm64-server-*"]
  }

  filter {
    name   = "architecture"
    values = ["arm64"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

resource "aws_key_pair" "neko_key" {
  key_name   = "${var.project_name}-key"
  public_key = file(var.ssh_public_key_path)
}

resource "aws_security_group" "neko_sg" {
  name        = "${var.project_name}-sg"
  description = "Security group for Neko Rooms"

  ingress {
    description = "Neko Rooms HTTP"
    from_port   = 8080
    to_port     = 8080
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "Neko WebRTC TCP"
    from_port   = 59000
    to_port     = 59049
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "Neko WebRTC UDP"
    from_port   = 59000
    to_port     = 59049
    protocol    = "udp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  ingress {
    description = "SSH from your IP only"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.allowed_ssh_cidr]
  }

  ingress {
    description = "HTTP for TLS certificate"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTPS"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    description = "All outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name    = "${var.project_name}-sg"
    Project = var.project_name
  }
}

resource "aws_eip" "neko_ip" {
  domain = "vpc"

  tags = {
    Name    = "${var.project_name}-eip"
    Project = var.project_name
  }
}

resource "aws_ebs_volume" "neko_data" {
  availability_zone = var.availability_zone
  size              = var.data_volume_size_gb
  type              = "gp3"
  encrypted         = true

  tags = {
    Name    = "${var.project_name}-data"
    Project = var.project_name
  }

  lifecycle {
    prevent_destroy = true
  }
}

resource "aws_instance" "neko" {
  ami                         = data.aws_ami.ubuntu.id
  instance_type               = var.instance_type
  availability_zone           = var.availability_zone
  key_name                    = aws_key_pair.neko_key.key_name
  vpc_security_group_ids      = [aws_security_group.neko_sg.id]
  associate_public_ip_address = true

  user_data_replace_on_change = true

  root_block_device {
    volume_size = 40
    volume_type = "gp3"
  }

  user_data = templatefile("${path.module}/user_data.sh.tftpl", {
    public_ip              = aws_eip.neko_ip.public_ip
    data_volume_id         = aws_ebs_volume.neko_data.id
    data_volume_id_no_dash = replace(aws_ebs_volume.neko_data.id, "-", "")

    docker_compose_yml    = file("${path.module}/../neko-rooms-club/docker-compose.yml")
    caddy_basic_auth_hash = var.caddy_basic_auth_hash
  })

  tags = {
    Name    = var.project_name
    Project = var.project_name
  }
}

resource "aws_volume_attachment" "neko_data_attach" {
  device_name  = var.data_volume_device_name
  volume_id    = aws_ebs_volume.neko_data.id
  instance_id  = aws_instance.neko.id
  force_detach = true
}

resource "aws_eip_association" "neko_ip_assoc" {
  instance_id   = aws_instance.neko.id
  allocation_id = aws_eip.neko_ip.id
}
