import { V1ContainerPort } from "@kubernetes/client-node";

interface DeploymentMetadata {
  name: string;
  labels: { app: string; user: string };
  namespace: string;
}

interface TemplateMetadata {
  labels: {
    app: string;
    user: string;
  };
}

interface TemplateSpec {
  containers: {
    name: string;
    image: string;
    ports: {
      containerPort: V1ContainerPort[];
    };
  }[];
}

interface MatchLabels {
  matchLabels: { app: string; user: string };
}

interface Template {
  metadata: TemplateMetadata;
  spec: TemplateSpec;
}

interface DeploymentSpec {
  replicas: number;
  selector: MatchLabels;
  template: Template;
}

export interface Deployment {
  apiVersion: string;
  kind: string;
  metadata: DeploymentMetadata;
  spec: DeploymentSpec;
}
