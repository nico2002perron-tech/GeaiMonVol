import { Metadata } from 'next';
import AgentClient from './AgentClient';

export const metadata: Metadata = {
  title: 'GeaiAI Agent — Agent de voyage IA | GeaiMonVol',
  description:
    'Parle avec GeaiAI, ton agent de voyage IA. Il peut chercher des vols, analyser les prix, et te trouver la destination parfaite.',
};

export default function AgentPage() {
  return <AgentClient />;
}
