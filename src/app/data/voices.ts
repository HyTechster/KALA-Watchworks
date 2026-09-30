export interface OwnerVoice {
  readonly id: string;
  readonly quote: string;
  readonly name: string;
  readonly city: string;
  readonly model: string;
}

export const VOICES_COPY = {
  eyebrow: 'Owner Voices',
  title: 'Worn, not kept in a drawer.',
  intro: 'Notes from people who wear their KALA every day. All owners are fictional, like the rest of this brand.',
  owns: 'Owns',
} as const;

export const VOICES_ROW_A: readonly OwnerVoice[] = [
  {
    id: 'v1',
    quote: 'I set it once in March. It is still within four seconds of the station clock.',
    name: 'Hana Rusdi',
    city: 'Penang',
    model: 'Satu K-101',
  },
  {
    id: 'v2',
    quote: 'The caseback is the part I show people. They always go quiet for a second.',
    name: 'Tomas Welling',
    city: 'Rotterdam',
    model: 'Kala Tiga K-303',
  },
  {
    id: 'v3',
    quote: 'Wore it through two monsoon seasons and a reef dive. Not a drop inside.',
    name: 'Arif Kamaludin',
    city: 'Kota Kinabalu',
    model: 'Laut K-210',
  },
  {
    id: 'v4',
    quote: 'A handwritten letter arrived with it, signed by the person who built it. That did it for me.',
    name: 'Mireille Aubert',
    city: 'Lyon',
    model: 'Senja K-120',
  },
  {
    id: 'v5',
    quote: 'The pushers click like a good camera shutter. I time my espresso with it every morning.',
    name: 'Kenji Oyama',
    city: 'Osaka',
    model: 'Detik K-340',
  },
];

export const VOICES_ROW_B: readonly OwnerVoice[] = [
  {
    id: 'v6',
    quote: 'Winding it on Sunday night has become a small ritual. Seventy-two hours feels generous.',
    name: 'Sofia Lindqvist',
    city: 'Malmö',
    model: 'Satu K-101',
  },
  {
    id: 'v7',
    quote: 'The meteorite dial looks different in every light. My daughter calls it the galaxy watch.',
    name: 'Daniel Okafor',
    city: 'Lagos',
    model: 'Bulan K-388',
  },
  {
    id: 'v8',
    quote: 'Light enough that I forget it is there, until someone asks the time and I get to look.',
    name: 'Priya Venkat',
    city: 'Bengaluru',
    model: 'Pantas K-360',
  },
  {
    id: 'v9',
    quote: 'Serviced after six years. It came back with a note explaining every part they touched.',
    name: 'Lukas Brenner',
    city: 'Graz',
    model: 'Dalam K-250',
  },
  {
    id: 'v10',
    quote: 'The teal is not a photo trick. In morning sun it looks like shallow water over sand.',
    name: 'Aina Sofea',
    city: 'Kuala Lumpur',
    model: 'Kala Tiga K-303',
  },
];
