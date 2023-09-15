package main

import (
	"fmt"
	"net"
	"sort"
	_ "sync"
)

func worker(ports, results chan int) {
	for p := range ports {
		address := fmt.Sprintf("scanme.nmap.org:%d", p)
		conn, err := net.Dial("tcp", address)
		if err != nil {
			//This case will trigger when the port is closed/filtered :)
			results <- 0
			continue
		}
		conn.Close()
		results <- p
	}
}

func RunScan() {
	ports := make(chan int, 100)
	results := make(chan int)
	var openPorts []int
	fmt.Println("[*] Starting Scan")
	for i := 0; i < cap(ports); i++ {
		go worker(ports, results)
	}
	go func() {
		for i := 1; i <= 1024; i++ {
			ports <- i
		}
	}()
	for i := 0; i < 1024; i++ {
		port := <-results
		if port != 0 {
			openPorts = append(openPorts, port)
		}
	}
	close(ports)
	close(results)
	sort.Ints(openPorts)
	for _, port := range openPorts {
		fmt.Printf("[+] %d open\n", port)
	}
}

//TODO Remote code execution?
//TODO CLI params instead of hard-coded values
