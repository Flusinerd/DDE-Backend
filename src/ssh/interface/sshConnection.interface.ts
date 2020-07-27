import SSH2Promise = require("ssh2-promise");

export interface SSHConnetion{
  id: number;
  sshConnection: SSH2Promise;
  clientId: string;
  isOpen: boolean;
}