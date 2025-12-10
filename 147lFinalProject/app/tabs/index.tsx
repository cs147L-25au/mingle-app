import Loading from "../../components/loading";
import Map from "../../components/map";
import useSession from "../../utils/useSession";

export default function Home() {
  const session = useSession();

  if (!session) {
    return <Loading />;
  }

  return <Map />;
}
