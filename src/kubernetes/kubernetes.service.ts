import { Injectable, Logger } from '@nestjs/common';
import * as k8s from '@kubernetes/client-node';
import { PodConfig } from './dto/PodConfig.class';
import {
  V1Container,
  V1DeploymentSpec,
  V1PodTemplateSpec,
  V1Deployment,
} from '@kubernetes/client-node';
import { Deployment } from './dto/deployment.interface';
import { User } from '../auth/schema/user.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class KubernetesService {
  private _config: k8s.KubeConfig;
  private _appApi: k8s.AppsV1Api;
  private _coreApi: k8s.CoreV1Api;
  private _logger = new Logger('Kubernetes');

  constructor(@InjectModel(User.name) private userModel: Model<User>) {
    // Setup kubernetes API
    this._config = new k8s.KubeConfig();
    this._config.loadFromDefault();
    this._appApi = this._config.makeApiClient(k8s.AppsV1Api);
    this._coreApi = this._config.makeApiClient(k8s.CoreV1Api);
    this._logger.log(`Kubernetes API Connected`);

    this._logger.log('Creating test deployment');

    userModel.create().then((user) => {
      user.username = 'j19k1107';
  
      const podConfig: PodConfig = {
        imageName: 'flusinerd/ubuntussh:latest',
        user: new User()
      }
      
      this.createDeployment(podConfig).then(() => {
        this._logger.debug('Deployment created');
      })
    });

  }

  async getPods(namespace: string): Promise<k8s.V1Pod[]> {
    return (await this._coreApi.listNamespacedPod(namespace)).body.items;
  }

  async createDeployment(podConfig: PodConfig): Promise<V1Deployment> {
    if (!podConfig.user || !podConfig.user.username) throw new Error('No username was provided');

    this._logger.log(`Checking if namespace ${podConfig.user.username} exists`);
    const namespaceExists = await this._namespaceExists(podConfig.user.username);

    if (!namespaceExists) {
      // Create Namespace
      this._createNamespace(podConfig.user.username);
    }

    this._logger.log(`Creating Deployment for User ${podConfig.user.username} with image ${podConfig.imageName} Pod`);
    const res = await this._appApi.createNamespacedDeployment(
      podConfig.user.username,
      this._createDeploymentData(podConfig.user.username, podConfig.imageName)
    );
    return res.body;
  }

  private async _namespaceExists(namespace: string): Promise<boolean> {
    const res = await this._coreApi.listNamespace();
    const namespaceFound = res.body.items.find(
      searchElement => searchElement.metadata.name === namespace,
    );
    if (namespaceFound) return true;
    return false;
  }

  private async _createNamespace(namespace: string){
    return this._coreApi.createNamespace({
      apiVersion: 'v1',
      kind: 'Namespace',
      metadata: {
        name: namespace
      }
    })
  }

  private _createDeploymentData(username: string, image: string): V1Deployment {
    const deploymentData: V1Deployment = {
      apiVersion: 'apps/v1',
      kind: 'Deployment',
      metadata: {
        name: `${username}-${image}-deployment`,
        labels: {
          app: image,
          user: username,
        },
        namespace: username,
      },
      spec: {
        replicas: 1,
        selector: {
          matchLabels: {
            app: image,
            user: username,
          },
        },
        template: {
          metadata: {
            labels: {
              app: image,
              user: username,
            },
          },
          spec: {
            containers: [
              {
                image: image,
                name: `${username}-${image}`,
                ports: [{ containerPort: 22 }],
              },
            ],
          },
        },
      },
    };

    return deploymentData;
  }
}
