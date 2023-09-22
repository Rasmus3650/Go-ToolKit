package main

import (
	"fmt"
	"net"
	"os"
)

func handleConnection(conn net.Conn) {
	defer conn.Close()

	for {
		buffer := make([]byte, 1024)
		n, err := conn.Read(buffer)
		if err != nil {
			fmt.Println("Connection closed")
			return
		}

		command := string(buffer[:n])
		fmt.Print("Shell> ")
		fmt.Scanln(&command)

		if command == "terminate" {
			conn.Write([]byte("terminate"))
			return
		}

		conn.Write([]byte(command))
	}
}

func main() {
	//Set Address to listening port here
	listener, err := net.Listen("tcp", "127.0.0.1:8080")
	if err != nil {
		fmt.Println("Error listening:", err)
		os.Exit(1)
	}
	defer listener.Close()

	fmt.Println("[+] Listening for incoming TCP connection on port 8080")

	for {
		conn, err := listener.Accept()
		if err != nil {
			fmt.Println("Error accepting connection:", err)
			continue
		}

		fmt.Println("[+] We got a connection from:", conn.RemoteAddr())

		go handleConnection(conn)
	}
}
