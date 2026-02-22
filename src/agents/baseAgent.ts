export interface MayaAgent {
  name: string;
  role: string;
  execute(input: any): Promise<any>;
}
