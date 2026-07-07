export async function getServerSideProps() {
  return { redirect: { destination: '/overview', permanent: false } };
}

export default function Index() {
  return null;
}
