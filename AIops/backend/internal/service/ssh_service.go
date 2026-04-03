// internal/service/ssh_service.go
package service

import (
	"fmt"
	"net"
	"time"

	"golang.org/x/crypto/ssh"
)

type SSHService struct{}

func NewSSHService() *SSHService {
	return &SSHService{}
}

func (s *SSHService) TestConnection(host string, port int, user, privateKey string) error {
	signer, err := ssh.ParsePrivateKey([]byte(privateKey))
	if err != nil {
		return fmt.Errorf("failed to parse private key: %w", err)
	}

	config := &ssh.ClientConfig{
		User: user,
		Auth: []ssh.AuthMethod{
			ssh.PublicKeys(signer),
		},
		HostKeyCallback: ssh.InsecureIgnoreHostKey(),
		Timeout:         10 * time.Second,
	}

	addr := net.JoinHostPort(host, fmt.Sprintf("%d", port))
	client, err := ssh.Dial("tcp", addr, config)
	if err != nil {
		return fmt.Errorf("failed to connect: %w", err)
	}
	defer client.Close()

	session, err := client.NewSession()
	if err != nil {
		return fmt.Errorf("failed to create session: %w", err)
	}
	defer session.Close()

	if err := session.Run("echo test"); err != nil {
		return fmt.Errorf("failed to run test command: %w", err)
	}

	return nil
}
