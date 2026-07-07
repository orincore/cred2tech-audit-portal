import { requireAuthPage } from '../src/auth/requireAuthPage';

export const getServerSideProps = requireAuthPage(async () => ({
  redirect: { destination: '/overview', permanent: false },
}));

export default function Index() {
  return null;
}
