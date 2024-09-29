import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  sendAndConfirmTransaction,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import { fs } from "mz";
import path from "path";

const PROGRAM_KEY_PAIR_PATH = path.join(
  __dirname,
  "../dist/program/program-keypair.json"
);

const programIdGetting = async (): Promise<PublicKey> => {
  const secretKeyJSON = await fs.readFile(PROGRAM_KEY_PAIR_PATH, {
    encoding: "utf8",
  });
  const secretKey = Uint8Array.from(JSON.parse(secretKeyJSON));

  const programKeypair = Keypair.fromSecretKey(secretKey);

  return programKeypair.publicKey;
};

const client = async () => {
  console.log("Launching client...");

  const connection = new Connection("https://localhost:8899", "confirmed");
  const programId = await programIdGetting();

  const triggerKeypair = Keypair.generate();

  // Signature
  const airdropSignature = await connection.requestAirdrop(
    triggerKeypair.publicKey,
    2 * LAMPORTS_PER_SOL
  );

  // Confirming the transaction
  const latestBlockHash = await connection.getLatestBlockhash();
  await connection.confirmTransaction({
    blockhash: latestBlockHash.blockhash,
    lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
    signature: airdropSignature,
  });

  // To see if the transaction was successful
  console.log("Triggering the program id: ", programId.toBase58());

  // Instruction
  const instruction = new TransactionInstruction({
    keys: [
      { pubkey: triggerKeypair.publicKey, isSigner: false, isWritable: true },
    ],
    programId,
    data: Buffer.alloc(0),
  });

  await sendAndConfirmTransaction(
    connection,
    new Transaction().add(instruction),
    [triggerKeypair]
  );
};

client().then(
  () => process.exit(),
  (err) => {
    console.error(err);
    process.exit(-1);
  }
);
