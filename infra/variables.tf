variable "aws_region" {
  type    = string
  default = "us-west-2"
}

variable "project_name" {
  type    = string
  default = "poker-club-neko"
}

variable "instance_type" {
  type    = string
  default = "t3.xlarge"
}

variable "ssh_public_key_path" {
  type    = string
  default = "~/.ssh/id_rsa.pub"
}

variable "allowed_ssh_cidr" {
  type        = string
  description = "Your IP address for SSH, example: 71.63.160.218/32"
}