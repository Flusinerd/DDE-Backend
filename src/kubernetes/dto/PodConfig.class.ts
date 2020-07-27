import { V1ContainerPort } from "@kubernetes/client-node";
import { SSHConfig } from "../../ssh/interface/sshconfig.interface";
import { User } from "../../auth/schema/user.schema";

export class PodConfig{
  private _imageName?: string;
  private _imageTag?:  string;
  volumeName?: string;
  sshConfig?: SSHConfig
  user: User

  set imageName(imageName: string){
    const parts = imageName.split(':');
    this._imageName = parts[0];
    if (parts[1]){
      this._imageTag = parts[1];
    }
  }

  get imageName(): string{
    if (this._imageTag){
      return `${this.imageName}:${this._imageTag}`;
    } else {
      return this._imageName;
    }
  }
}