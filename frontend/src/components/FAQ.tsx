import { useState } from 'react'
import SectionShell from './SectionShell'

const faqs = [
  {
    question: 'What is MERIDIAN?',
    answer:
      'MERIDIAN is a Casper-native frontend and service stack for compliant RWA operations. It connects live testnet contracts, backend-indexed data, CSPR.click wallet signing, MCP tools, x402 paid resources, and AI agent decisions.',
  },
  {
    question: 'Is the frontend using real data?',
    answer:
      'Yes. The browser calls local Next.js /api routes. Those routes proxy to the Render backend, MCP server, and x402 service. Tokens, events, holders, decisions, and yield data come from backend-indexed Casper testnet state.',
  },
  {
    question: 'How are transactions made?',
    answer:
      'Write flows call MCP tools to build unsigned TransactionV1 payloads. The frontend shows a transaction review card, CSPR.click asks Casper Wallet to sign, and the signed transaction is submitted to Casper testnet.',
  },
  {
    question: 'What still needs manual verification?',
    answer:
      'The remaining production gate is funded-wallet testing from the browser: wallet reconnect, MCP write transactions, x402 settlement, explorer links, and post-transaction data refresh.',
  },
  {
    question: 'Are private keys or API keys exposed?',
    answer:
      'No backend secrets are exposed in the client bundle. MERIDIAN_API_KEY, CSPR.cloud keys, database credentials, and PEM material stay server-side. Wallet private keys remain inside Casper Wallet.',
  },
]

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <SectionShell id="faq">
      <div className="border-b border-white/10 px-6 py-12 text-center sm:px-10 lg:px-14 lg:py-16">
        <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Frequently Asked Questions
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-zinc-500 sm:text-base">
          Practical answers for the current live testnet frontend and the remaining production
          verification gates.
        </p>
      </div>

      <div className="divide-y divide-white/10">
        {faqs.map((faq, index) => {
          const isOpen = openIndex === index
          return (
            <div key={faq.question}>
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? null : index)}
                className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left transition hover:bg-white/[0.02] sm:px-10 lg:px-14"
                aria-expanded={isOpen}
              >
                <span className="font-medium text-white">{faq.question}</span>
                <span className="text-xl leading-none text-zinc-500">{isOpen ? '−' : '+'}</span>
              </button>
              {isOpen && (
                <div className="px-6 pb-6 sm:px-10 lg:px-14">
                  <p className="max-w-3xl text-sm leading-relaxed text-zinc-500">{faq.answer}</p>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </SectionShell>
  )
}
