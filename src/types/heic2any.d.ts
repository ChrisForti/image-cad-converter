declare module "heic2any" {
  interface ConversionOptions {
    blob: Blob;
    toType?: string;
    quality?: number;
    multiple?: boolean;
  }

  function heic2any(options: ConversionOptions): Promise<Blob | Blob[]>;
  export default heic2any;
}
