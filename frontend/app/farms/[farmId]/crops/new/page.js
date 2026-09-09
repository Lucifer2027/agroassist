import CreateCropClient from './CreateCropClient';

export function generateStaticParams() {
  return [{ farmId: '_' }];
}

export default function CreateCropPage() {
  return <CreateCropClient />;
}
