output "instance_id" {
  value = aws_instance.neko.id
}

output "public_ip" {
  value = aws_eip.neko_ip.public_ip
}

output "neko_rooms_url" {
  value = "http://${aws_eip.neko_ip.public_ip}:8080"
}

output "data_volume_id" {
  value = aws_ebs_volume.neko_data.id
}

output "data_volume_mount_path" {
  value = "/opt/neko-rooms/data"
}

output "neko_instance_id" {
  description = "EC2 instance ID for the Neko Rooms server"
  value       = aws_instance.neko.id
}

output "neko_public_ip" {
  description = "Elastic IP attached to the Neko Rooms server"
  value       = aws_eip.neko_ip.public_ip
}

output "neko_rooms_public_url" {
  description = "Public URL for the Neko Rooms manager"
  value       = "http://${aws_eip.neko_ip.public_ip}:8080"
}

output "ssh_command" {
  description = "SSH command for the Neko Rooms EC2 instance"
  value       = "ssh -i ~/.ssh/id_rsa ubuntu@${aws_eip.neko_ip.public_ip}"
}