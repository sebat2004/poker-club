variable "aws_region" {
  type    = string
  default = "us-west-2"

  validation {
    condition     = var.aws_region == "us-west-2"
    error_message = "This project is pinned to us-west-2."
  }
}

variable "availability_zone" {
  type    = string
  default = "us-west-2a"
}

variable "project_name" {
  type    = string
  default = "poker-club-neko"
}

variable "instance_type" {
  type    = string
  default = "c7i.xlarge"
}

variable "ssh_public_key_path" {
  type    = string
  default = "~/.ssh/id_rsa.pub"
}

variable "allowed_ssh_cidr" {
  type        = string
  description = "Your IP address for SSH, example: 71.63.160.218/32"
}

variable "data_volume_size_gb" {
  type    = number
  default = 20
}

variable "data_volume_device_name" {
  type    = string
  default = "/dev/sdf"
}
