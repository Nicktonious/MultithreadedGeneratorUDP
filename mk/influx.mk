.PHONY: influx
influx: /etc/apt/sources.list.d/influxdata.list.ucf-dist

/etc/apt/keyrings/influxdata-archive_compat.key:
	sudo curl -fsSL https://repos.influxdata.com/influxdata-archive_compat.key -o $@

/etc/apt/sources.list.d/influxdata.list: /etc/apt/keyrings/influxdata-archive_compat.key
	echo "deb [signed-by=$<] https://repos.influxdata.com/debian stable main" | sudo tee $@

/etc/apt/sources.list.d/influxdata.list.ucf-dist: /etc/apt/sources.list.d/influxdata.list
	sudo apt update
	sudo apt install -uy influxdb telegraf
	sudo touch $@
