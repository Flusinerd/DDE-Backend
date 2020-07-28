import { Injectable, Logger } from '@nestjs/common';
import * as k8s from '@kubernetes/client-node';
import { PodConfig } from './dto/PodConfig.class';
import { V1Deployment, V1Service } from '@kubernetes/client-node';
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

  constructor() {
    // Setup kubernetes API
    this._config = new k8s.KubeConfig();
    this._config.loadFromDefault();
    this._appApi = this._config.makeApiClient(k8s.AppsV1Api);
    this._coreApi = this._config.makeApiClient(k8s.CoreV1Api);
    this._logger.log(`Kubernetes API Connected`);

    this._logger.log('Creating test deployment');

    const user = {username: 'j19k1107'}

    const podConfig: PodConfig = {
      imageName: 'flusinerd/ubuntussh:latest',
      user: user
    };

    this.createDeployment(podConfig).then(async () => {
      this._logger.debug('Deployment created');
      const service = await this.createService(podConfig);
      const port = service.spec.ports[0].nodePort;
      this._logger.debug('Service created on Port ' + port);
    });
  }

  async getPods(namespace: string): Promise<k8s.V1Pod[]> {
    return (await this._coreApi.listNamespacedPod(namespace)).body.items;
  }

  async createDeployment(podConfig: PodConfig): Promise<V1Deployment> {
    if (!podConfig.user || !podConfig.user.username)
      throw new Error('No username was provided');

    this._logger.log(`Checking if namespace ${podConfig.user.username} exists`);
    const namespaceExists = await this._namespaceExists(
      podConfig.user.username,
    );

    if (!namespaceExists) {
      // Create Namespace
      this._createNamespace(podConfig.user.username);
    }

    // Check if deployment already exists
    if (await this._checkIfDeploymentAlreadyCreated(podConfig.user.username, podConfig.imageName)) throw new Error('Deployment already exists');

    this._logger.log(
      `Creating Deployment for User ${podConfig.user.username} with image ${podConfig.imageName}`,
    );
    try {
      const res = await this._appApi.createNamespacedDeployment(
        podConfig.user.username,
        this._createDeploymentData(podConfig.user.username, podConfig.imageName),
        );
        return res.body;
    } catch (error) {
      this._logger.error(error);
    }
  }

  /**
   * Creates a nodePort service for the pod
   * @param podConfig Pod Configuration Data
   */
  async createService(podConfig: PodConfig): Promise<V1Service>{
    this._logger.log(`Creating Service for Pod ${podConfig.imageName} in namespace ${podConfig.user.username}`);
    try {
      const res = await this._coreApi.createNamespacedService(podConfig.user.username, this._createServiceData(podConfig.user.username, podConfig.imageName, 22));
      return res.body;
    } catch (error) {
      this._logger.error(error);
    }
  }

  /**
   * Checks if the namespace exists. Returns true when exists
   * @param namespace Namespace name
   */
  private async _namespaceExists(namespace: string): Promise<boolean> {
    const res = await this._coreApi.listNamespace();
    const namespaceFound = res.body.items.find(
      searchElement => searchElement.metadata.name === namespace,
    );
    if (namespaceFound) return true;
    return false;
  }

  /**
   * Checks if there already is a deployment for the image in the users namespace.
   * Returns true if exists
   * Returns false if namespace does not exist or deployment does not exists
   * @param username username
   * @param image image name with tag image:tag
   */
  private async _checkIfDeploymentAlreadyCreated(username: string, image: string): Promise<boolean>{
    if (!await this._namespaceExists(username)) return false;
    const deployments = (await this._appApi.listNamespacedDeployment(username)).body.items;
    const friendlyImageName = image.replace('/', '').split(':')[0];
    if (deployments.find((searchElement) => searchElement.metadata.name === `${username}-${friendlyImageName}-deployment`)) return true;
    else return false;
  }

  /**
   * Creates a namespace with the provided name
   * @param namespace namespace nam
   */
  private async _createNamespace(namespace: string) {
    return this._coreApi.createNamespace({
      apiVersion: 'v1',
      kind: 'Namespace',
      metadata: {
        name: namespace,
      },
    });
  }

  /**
   * Creates Service Data for the deployment
   * @param username username of the user
   * @param image Image Name of the user
   */
  private _createServiceData(username: string, image: string, port: number): V1Service{
    const friendlyImageName = image.replace('/', '').split(':')[0];
    const serviceData: V1Service = {
      apiVersion: 'v1',
      kind: 'Service',
      metadata: {
        name: `${username}-${friendlyImageName}-ssh-service`,
        namespace: username
      },
      spec: {
        selector: {
          app: friendlyImageName,
          user: username},
        type: 'NodePort',
        ports: [{
          port
        }]
      },
    }

    return serviceData;
  }

  /**
   * Creates deployment data for the pod deployment
   * @param username username
   * @param image image name
   */
  private _createDeploymentData(username: string, image: string): V1Deployment {
    const friendlyImageName = image.replace('/', '').split(':')[0];
    const deploymentData: V1Deployment = {
      apiVersion: 'apps/v1',
      kind: 'Deployment',
      metadata: {
        name: `${username}-${friendlyImageName}-deployment`,
        labels: {
          app: friendlyImageName,
          user: username,
        },
        namespace: username,
      },
      spec: {
        replicas: 1,
        selector: {
          matchLabels: {
            app: friendlyImageName,
            user: username,
          },
        },
        template: {
          metadata: {
            labels: {
              app: friendlyImageName,
              user: username,
            },
          },
          spec: {
            containers: [
              {
                image: image,
                name: `${username}-${friendlyImageName}`,
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
