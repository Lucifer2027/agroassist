import EditCropClient from './EditCropClient';

export function generateStaticParams() {
  return [{ cropId: '_' }];
}

export default function EditCropPage() {
  return <EditCropClient />;
}
