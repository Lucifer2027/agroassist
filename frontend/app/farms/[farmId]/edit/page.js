import EditFarmClient from './EditFarmClient';

export function generateStaticParams() {
  return [{ farmId: '_' }];
}

export default function EditFarmPage() {
  return <EditFarmClient />;
}
