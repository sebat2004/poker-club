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
