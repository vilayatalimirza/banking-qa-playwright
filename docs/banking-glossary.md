# Banking and Fintech Glossary

A practical reference for people building, testing, or working with banking and
fintech products. Each term has an interview-ready definition followed by a
plain-language explanation, as a seasoned banker might explain it to a child.
Exact behavior can vary by product, account type, payment scheme, and
jurisdiction; use product requirements and applicable rules as the source of truth.

> 🟦 **Interview-ready** = precise domain language  |  🧒 **Simple explanation** = plain words and an everyday analogy

---

## 🟦 Accounts and balances

- 🎓 **Interview-ready — Account:** A record used to hold, track, or move money for a customer or
  business. An account has an owner, currency, status, identifiers, and
  transaction history. A bank account is a claim on the bank; it is not a
  separate container of identifiable cash.
  - 🧒 **Simple explanation:** Think of it as your labeled pocket at a bank: it keeps track of money that belongs to you.
- 🎓 **Interview-ready — Account holder:** The person or legal entity that owns an account.
  **Authorized user/signatory** means someone permitted to use or approve
  activity on it, who may not be its owner.
  - 🧒 **Simple explanation:** This is the person whose name is on the money pocket.
- 🎓 **Interview-ready — Account identifier:** A value used to identify an account or payment
  destination. Examples include an **IBAN** (International Bank Account Number),
  a domestic account number plus routing/sort code, and a **BIC/SWIFT code**
  identifying a financial institution. Formats and validation rules vary by
  country.
  - 🧒 **Simple explanation:** It is like the address on a letter: it tells the bank exactly where money should go.
- 🎓 **Interview-ready — Account status:** Whether an account can be used. Common states include
  pending, active, restricted, frozen, dormant, and closed. A restricted
  account may allow some actions but block others.
  - 🧒 **Simple explanation:** It is the account's traffic light: green means usable, while other states can mean limited or stopped.
- 🎓 **Interview-ready — Ledger:** The authoritative record of financial entries. A double-entry
  ledger records each transaction with equal debits and credits across accounts,
  preserving the accounting equation. A ledger entry is usually immutable;
  corrections are made with reversing or adjusting entries rather than silently
  rewriting history.
  - 🧒 **Simple explanation:** It is the bank's permanent money diary; every move is written down and the books must balance.
- 🎓 **Interview-ready — Journal / journal entry:** The grouped accounting record for a business
  event, containing one or more balanced ledger entries.
  - 🧒 **Simple explanation:** It is one carefully written note describing a money event and all the accounts it affects.
- 🎓 **Interview-ready — Subledger:** A detailed record for a particular product or customer
  population that reconciles to the general ledger.
  - 🧒 **Simple explanation:** It is a detailed notebook for one group of accounts that must agree with the bank's main notebook.
- 🎓 **Interview-ready — General ledger (GL):** The institution-wide accounting record used for
  financial reporting and control.
  - 🧒 **Simple explanation:** It is the bank's big master book that brings all the smaller money records together.
- 🎓 **Interview-ready — Current (book) balance:** The balance after transactions posted to the
  account have been included. Depending on the product, it may exclude
  authorizations or other pending items.
  - 🧒 **Simple explanation:** It is the amount the account shows after completed entries have been written in.
- 🎓 **Interview-ready — Available balance:** The amount currently available to spend or withdraw.
  It commonly starts from the current balance, subtracts holds or pending debits,
  and adds eligible pending credits or overdraft limits. The exact calculation
  is product-specific.
  - 🧒 **Simple explanation:** It is what you can use right now after the bank sets aside money for pending purchases.
- 🎓 **Interview-ready — Pending transaction:** An initiated transaction that has not completed its
  full processing or posting lifecycle. Its effect on available and current
  balances depends on the transaction type and product.
  - 🧒 **Simple explanation:** It is a money move that has started but is not fully finished yet.
- 🎓 **Interview-ready — Hold / authorization hold:** An amount reserved against an account or
  card's available funds, often before the final amount is known. A hold can
  expire, be released, or be replaced by a posted transaction.
  - 🧒 **Simple explanation:** It is like putting a toy aside at a shop: the money is reserved, even though the final purchase is not complete.
- 🎓 **Interview-ready — Overdraft:** A permitted negative balance or short-term credit facility.
  Availability, limits, fees, and repayment rules depend on the agreement.
  - 🧒 **Simple explanation:** It is permission to spend a little more than you have, which usually means borrowing from the bank.
- 🎓 **Interview-ready — Credit limit:** The maximum amount a lender permits a customer to borrow
  under a credit product.
  - 🧒 **Simple explanation:** It is the most the lender lets you borrow, like a borrowing ceiling.
- 🎓 **Interview-ready — Statement:** A dated summary of posted transactions, fees, interest, and
  balances for an account or period.
  - 🧒 **Simple explanation:** It is a report card showing what came in, what went out, and what is left for a period.

## 🟣 Accounting and transaction language

- 🎓 **Interview-ready — Debit and credit:** The two sides of double-entry accounting, not universal
  synonyms for money in and money out. A debit increases assets and expenses
  and decreases liabilities, equity, and income; a credit does the reverse.
  For a customer deposit, the bank debits its cash or reserves (an asset) and
  credits its deposit liability. The customer's bank statement normally shows
  the deposit as a credit. In the customer's own accounting records, the deposit
  increases the bank-account asset and is recorded as a debit. Always establish
  whose books and which account are being described.
  - 🧒 **Simple explanation:** They are the two sides of the bank's bookkeeping. Whether each means money in or out depends on whose books you are reading.
- 🎓 **Interview-ready — Posting:** Applying a transaction to the ledger so it becomes part of the
  posted balance and transaction history.
  - 🧒 **Simple explanation:** It is when the bank writes a completed money move into its official account book.
- 🎓 **Interview-ready — Value date:** The date from which a transaction or balance is treated as
  economically effective, for example for interest calculation. It can differ
  from the processing or posting date.
  - 🧒 **Simple explanation:** It is the date the bank treats the money as counting, which can differ from the day it was typed or recorded.
- 🎓 **Interview-ready — Transaction lifecycle:** The stages a payment or account event passes
  through, such as created, authorized, submitted, pending, settled, posted,
  rejected, reversed, or returned. Names and transitions vary by rail.
  - 🧒 **Simple explanation:** It is the journey a payment takes from being requested to finishing, failing, or being sent back.
- 🎓 **Interview-ready — Reversal:** A new transaction that offsets a previous transaction, often
  after a payment is cancelled or cannot complete. It is not necessarily the
  same as a refund.
  - 🧒 **Simple explanation:** It is a new entry that cancels the effect of an earlier one, while keeping both events in the record.
- 🎓 **Interview-ready — Refund:** A separate credit sent back to a payer after a completed
  purchase. It may take time to appear and may not immediately release an
  original authorization hold.
  - 🧒 **Simple explanation:** It is money a seller sends back after a purchase, like returning something to a shop and getting your money back.
- 🎓 **Interview-ready — Reconciliation:** Comparing records from different systems or parties
  (for example, internal ledger entries and a bank or processor statement) to
  identify and resolve missing, duplicate, or mismatched transactions.
  - 🧒 **Simple explanation:** It is checking two money lists against each other to make sure nothing is missing or counted twice.
- 🎓 **Interview-ready — Settlement:** The final exchange of funds between financial institutions
  or scheme participants to discharge payment obligations. Customer-facing
  posting may happen before or after interbank settlement.
  - 🧒 **Simple explanation:** It is when the banks actually square up the money they owe each other.
- 🎓 **Interview-ready — Clearing:** The exchange, validation, and calculation of payment
  instructions and obligations before settlement.
  - 🧒 **Simple explanation:** It is the checking and sorting step that works out who owes whom before money is settled.
- 🎓 **Interview-ready — Cut-off time:** A processing deadline. Instructions received after it may
  be treated as received on the next business day.
  - 🧒 **Simple explanation:** It is the day's deadline; miss it and your request may wait until the next working day.
- 🎓 **Interview-ready — Business day:** A day defined as a working day by the relevant institution,
  scheme, or jurisdiction. Weekends and public holidays can affect processing.
  - 🧒 **Simple explanation:** It is a day the bank counts as a working day for processing, not necessarily every calendar day.
- 🎓 **Interview-ready — Reconciliation break:** A discrepancy that cannot be matched automatically,
  such as a missing entry, amount mismatch, duplicate, or timing difference.
  - 🧒 **Simple explanation:** It is a mismatch between two money lists that someone needs to investigate.

## 🟩 Payments and money movement

- 🎓 **Interview-ready — Payment rail:** The network and rules used to move money, such as card
  networks, ACH, SEPA, Faster Payments, or SWIFT.
  - 🧒 **Simple explanation:** It is the road or network a payment travels on, with its own speed and rules.
- 🎓 **Interview-ready — Payment initiation:** A request to send money. Initiation does not itself
  guarantee acceptance, settlement, or final posting.
  - 🧒 **Simple explanation:** It is asking for money to be sent; asking does not guarantee it will arrive.
- 🎓 **Interview-ready — Payer / payee:** The person or organization sending / receiving a payment.
  In a card purchase these are often called the **cardholder** and **merchant**.
  - 🧒 **Simple explanation:** The payer sends the money; the payee receives it.
- 🎓 **Interview-ready — Originating / receiving institution:** The institution sending / receiving
  a payment instruction or funds.
  - 🧒 **Simple explanation:** One bank starts or sends the payment instruction; the other bank receives it.
- 🎓 **Interview-ready — Domestic / cross-border payment:** A payment within one country's payment
  system / across national borders. Cross-border payments can involve currency
  conversion, intermediary institutions, extra data, and different timelines.
  - 🧒 **Simple explanation:** A domestic payment stays within one country's payment system; a cross-border one travels between countries.
- 🎓 **Interview-ready — Payment reference / remittance information:** Text or structured data that
  helps identify the purpose of a payment or match it to an invoice.
  - 🧒 **Simple explanation:** It is a note attached to the payment so the receiver knows what the money is for.
- 🎓 **Interview-ready — Standing order:** A customer instruction to send a fixed payment on a
  recurring schedule.
  - 🧒 **Simple explanation:** It is an instruction to send the same payment regularly, like paying pocket money every Friday.
- 🎓 **Interview-ready — Direct debit:** A payment collected by a payee under the payer's
  authorization (a mandate), subject to scheme and local rules.
  - 🧒 **Simple explanation:** It lets an approved company collect money from an account, according to agreed rules.
- 🎓 **Interview-ready — Mandate:** Permission for a payee or service provider to initiate
  collections or another defined action from an account.
  - 🧒 **Simple explanation:** It is permission for a company to collect money or perform a specified action.
- 🎓 **Interview-ready — ACH:** Automated Clearing House, a batch-based electronic payment network
  used in the United States for credits and debits.
  - 🧒 **Simple explanation:** It is a US network that sorts many electronic payments in batches, like processing a stack of letters together.
- 🎓 **Interview-ready — SEPA:** The Single Euro Payments Area, a framework for euro payments across
  participating countries. SEPA Credit Transfer and SEPA Direct Debit are
  different schemes.
  - 🧒 **Simple explanation:** It is a shared set of rules and payment networks for sending euros across participating European countries.
- 🎓 **Interview-ready — Faster Payments:** A UK payment service for near-real-time domestic
  transfers, subject to participant, availability, and limit rules.
  - 🧒 **Simple explanation:** It is a UK service designed to move domestic payments quickly, when the banks and service are available.
- 🎓 **Interview-ready — SWIFT:** A secure financial messaging network used by institutions to
  exchange payment and other financial messages. SWIFT messages are not
  themselves the movement or settlement of funds.
  - 🧒 **Simple explanation:** It is a secure message network banks use to tell each other about payments; the message itself is not the money.
- 🎓 **Interview-ready — Intermediary / correspondent bank:** A bank that helps route or settle a
  payment when the sending and receiving institutions do not have a direct
  relationship.
  - 🧒 **Simple explanation:** It is a helper bank that passes a payment along when the sender's and receiver's banks cannot connect directly.
- 🎓 **Interview-ready — Payment return:** A payment sent back through a scheme, often with a reason
  code. A return is distinct from a customer-initiated refund.
  - 🧒 **Simple explanation:** It is a payment sent back through the payment system, often with a reason why it could not stay with the receiver.
- 🎓 **Interview-ready — Idempotency:** A property that makes repeated submission of the same
  request produce no duplicate financial effect. APIs commonly use an
  idempotency key; retries must be tested for duplicate charges or transfers.
  - 🧒 **Simple explanation:** It means pressing 'try again' will not accidentally pay twice for the same request.
- 🎓 **Interview-ready — Payment limit:** A maximum amount or frequency allowed by a product,
  customer profile, risk control, or payment rail.
  - 🧒 **Simple explanation:** It is a maximum amount or number of payments allowed in a set time.

## 🟨 Cards and merchant payments

- 🎓 **Interview-ready — Card authorization:** The issuer's decision to approve or decline a
  requested card transaction, typically placing a hold when approved. It is not
  settlement.
  - 🧒 **Simple explanation:** It is the card bank checking whether a purchase can go ahead and often reserving the money.
- 🎓 **Interview-ready — Capture:** A merchant's request to complete an authorized card transaction
  for some or all of the authorized amount.
  - 🧒 **Simple explanation:** It is the seller asking the card system to collect the money that was approved earlier.
- 🎓 **Interview-ready — Acquirer:** The financial institution or processor that accepts card
  transactions for a merchant.
  - 🧒 **Simple explanation:** It is the bank or provider that helps a shop accept card payments.
- 🎓 **Interview-ready — Issuer:** The institution that issues a card or account to a customer and
  makes authorization decisions.
  - 🧒 **Simple explanation:** It is the bank or company that gave the customer their card.
- 🎓 **Interview-ready — Card network / scheme:** The rules and infrastructure connecting issuers,
  acquirers, and merchants, such as Visa or Mastercard.
  - 🧒 **Simple explanation:** It is the shared rulebook and connection that lets the shop's bank talk to the customer's card bank.
- 🎓 **Interview-ready — PAN:** Primary Account Number, the number identifying a payment card
  account. It is sensitive payment data and must be handled under applicable
  security requirements.
  - 🧒 **Simple explanation:** It is the long number that identifies a payment card account, so it must be protected.
- 🎓 **Interview-ready — Tokenization:** Replacing a sensitive identifier with a restricted-use
  token. A payment token is not necessarily the same as encryption.
  - 🧒 **Simple explanation:** It swaps a sensitive card number for a safer substitute, like using a nickname instead of a private name.
- 🎓 **Interview-ready — Card-present / card-not-present:** A transaction where the card is
  physically presented / where payment details are used remotely, such as
  online or by phone.
  - 🧒 **Simple explanation:** Card-present means the card is there at checkout; card-not-present means paying remotely, such as online.
- 🎓 **Interview-ready — 3-D Secure (3DS):** A protocol for authenticating customers during
  e-commerce card payments. It can support strong customer authentication but
  not every 3DS transaction requires a challenge.
  - 🧒 **Simple explanation:** It is an extra online card-payment safety check, sometimes asking the customer to confirm it is really them.
- 🎓 **Interview-ready — Chargeback:** A card-scheme dispute process that can reverse a transaction
  through the scheme, subject to reason codes, evidence, and deadlines.
  - 🧒 **Simple explanation:** It is a card-network process for challenging and potentially taking back a card payment under set rules.
- 🎓 **Interview-ready — Dispute:** A customer's challenge to a transaction. A dispute may lead to
  investigation, provisional credit, refund, or chargeback depending on the
  product and rules.
  - 🧒 **Simple explanation:** It is when a customer says a payment may be wrong and asks for it to be checked.
- 🎓 **Interview-ready — Merchant category code (MCC):** A code classifying a merchant's business
  type, used for reporting, controls, pricing, or rewards.
  - 🧒 **Simple explanation:** It is a short code that tells payment systems what kind of business a shop is.

## 🟥 Identity, access, and financial crime controls

- 🎓 **Interview-ready — KYC (Know Your Customer):** Processes for identifying and verifying a
  customer and understanding relevant aspects of their relationship with a
  financial institution. Requirements vary by jurisdiction and product.
  - 🧒 **Simple explanation:** It is the bank checking who you are before trusting you with an account or service.
- 🎓 **Interview-ready — KYB (Know Your Business):** Due diligence on a business customer, including
  verifying its existence, ownership, controllers, and authorized
  representatives.
  - 🧒 **Simple explanation:** It is those identity checks applied to a company and the people who own or run it.
- 🎓 **Interview-ready — Customer due diligence (CDD):** Risk-based collection and assessment of
  customer information to establish who the customer is and whether the
  relationship is appropriate.
  - 🧒 **Simple explanation:** It is the bank learning enough about a customer to decide what checks and services are appropriate.
- 🎓 **Interview-ready — Enhanced due diligence (EDD):** Additional checks for higher-risk
  customers, relationships, or activity.
  - 🧒 **Simple explanation:** It is extra careful checking when a customer or situation needs more attention.
- 🎓 **Interview-ready — Beneficial owner:** A natural person who ultimately owns or controls a
  legal entity, as defined by applicable rules.
  - 🧒 **Simple explanation:** It is the real person who ultimately owns or controls a company, even if another name appears on paperwork.
- 🎓 **Interview-ready — Politically exposed person (PEP):** A person entrusted with a prominent
  public function, and sometimes their family members or close associates, who
  may require additional risk assessment. PEP status alone does not mean
  wrongdoing.
  - 🧒 **Simple explanation:** It is someone with an important public role who may need extra checks; the label does not mean they did anything wrong.
- 🎓 **Interview-ready — Sanctions screening:** Checking customers, counterparties, or transactions
  against applicable sanctions lists and handling potential matches under
  policy and law.
  - 🧒 **Simple explanation:** It is checking names and payments against official restriction lists before allowing activity.
- 🎓 **Interview-ready — AML (Anti-Money Laundering):** Laws, controls, and processes intended to
  prevent, detect, and report money laundering and related financial crime.
  - 🧒 **Simple explanation:** It is the bank's set of checks to help stop criminals from hiding where money came from.
- 🎓 **Interview-ready — CTF/CFT:** Countering / combating the financing of terrorism; commonly
  addressed alongside AML controls.
  - 🧒 **Simple explanation:** It means checks intended to stop money being used to support terrorism.
- 🎓 **Interview-ready — Transaction monitoring:** Reviewing activity using rules, scenarios, or
  models to identify unusual patterns for investigation. An alert is not proof
  of misconduct.
  - 🧒 **Simple explanation:** It is watching patterns of money movement and asking questions when something looks unusual.
- 🎓 **Interview-ready — Suspicious activity report (SAR/STR):** A confidential report submitted to
  the relevant authority when required. Terminology and reporting thresholds
  vary by jurisdiction.
  - 🧒 **Simple explanation:** It is a confidential report a bank may have to send to authorities when activity raises a required concern.
- 🎓 **Interview-ready — False positive / false negative:** A control flags legitimate activity /
  fails to flag activity that should have been identified.
  - 🧒 **Simple explanation:** A false positive is an innocent activity wrongly flagged; a false negative is a risky activity the check misses.
- 🎓 **Interview-ready — Risk-based approach:** Applying controls proportionate to assessed risk
  rather than treating every customer or transaction identically.
  - 🧒 **Simple explanation:** It means using stronger checks where the risk is higher instead of treating every situation exactly the same.
- 🎓 **Interview-ready — Source of funds / source of wealth:** Where money for a particular
  transaction came from / how a customer's overall wealth was accumulated.
  - 🧒 **Simple explanation:** Source of funds asks where this particular money came from; source of wealth asks how someone built their overall wealth.
- 🎓 **Interview-ready — Fraud:** Deception intended to obtain money, services, or another benefit.
  Fraud controls and AML controls overlap but address different risks.
  - 🧒 **Simple explanation:** It is tricking someone to get money or another benefit unfairly.
- 🎓 **Interview-ready — Account takeover (ATO):** Unauthorized control of a legitimate customer's
  account, often following credential theft or social engineering.
  - 🧒 **Simple explanation:** It is when someone sneaks into another person's account and acts as if they were the owner.
- 🎓 **Interview-ready — Screening vs. monitoring:** Screening checks a person, entity, or
  transaction against defined lists or rules; monitoring looks for patterns of
  activity over time.
  - 🧒 **Simple explanation:** Screening checks against a list or rule; monitoring watches for unusual behavior over time.

## 🟣 Regulatory and messaging standards

- 🎓 **Interview-ready — ISO 20022:** An international financial messaging standard with a common
  data model and structured message definitions. It supports richer,
  consistently represented payment data; it is a standard, not a payment rail
  or a regulation by itself.
  - 🧒 **Simple explanation:** It is a shared financial-message language that helps banks describe payment details in a consistent, organized way.
- 🎓 **Interview-ready — Structured remittance data:** Machine-readable payment details (such as
  invoice references) carried in defined ISO 20022 fields rather than only in
  free text. Truncation or mapping errors can prevent automatic reconciliation.
  - 🧒 **Simple explanation:** It is payment information put into labeled boxes, so computers can understand what an invoice payment is for.
- 🎓 **Interview-ready — PSD2:** The EU's second Payment Services Directive, which established
  requirements for payment services, consumer protections, and, where
  applicable, access by regulated third-party providers. Local implementation
  and later rules matter.
  - 🧒 **Simple explanation:** It is an EU law that set rules for payment services, customer protections, and certain secure third-party services.
- 🎓 **Interview-ready — Strong Customer Authentication (SCA):** Under PSD2-related rules, an
  authentication approach using at least two independent elements from
  knowledge (something the user knows), possession (something they have), and
  inherence (something they are), subject to applicable scope and exemptions.
  - 🧒 **Simple explanation:** It asks for proof from at least two different types, such as something you know and something you have.
- 🎓 **Interview-ready — SCA exemption:** A permitted case where a payment may proceed without an
  SCA challenge, subject to eligibility, risk checks, and applicable rules.
  Exemption requests can be rejected or overridden; test both challenge and
  frictionless outcomes.
  - 🧒 **Simple explanation:** It is a rule-based reason a payment may skip the extra authentication step; the bank still checks whether that is allowed.
- 🎓 **Interview-ready — Open banking:** Regulated or consent-based sharing of financial data and/or
  payment initiation through secure interfaces. Consent scope, duration,
  revocation, and authentication are important behaviors to test.
  - 🧒 **Simple explanation:** It lets a customer give permission for approved services to securely read account information or start payments.
- 🎓 **Interview-ready — Payment Services Directive (PSD) terminology:** A payment initiation
  service provider (PISP) initiates a payment with customer consent; an account
  information service provider (AISP) accesses account information with
  customer consent, where permitted.
  - 🧒 **Simple explanation:** A PISP asks the bank to make a payment; an AISP, with permission, reads account information.
- 🎓 **Interview-ready — PCI DSS:** The Payment Card Industry Data Security Standard, a security
  standard for organizations that store, process, or transmit payment card
  data. Scope and validation obligations depend on the organization's role and
  environment.
  - 🧒 **Simple explanation:** It is a security rulebook for businesses that handle payment-card information.
- 🎓 **Interview-ready — GDPR:** The EU General Data Protection Regulation governing personal data
  processing, including lawful basis, transparency, data-subject rights, and
  security, where applicable.
  - 🧒 **Simple explanation:** It is a European privacy law that says organizations must handle people's personal information responsibly.
- 🎓 **Interview-ready — Regulatory compliance:** Meeting laws, regulations, supervisory
  requirements, scheme rules, and internal policies that apply to a product
  and its operating jurisdictions.
  - 🧒 **Simple explanation:** It means following the laws and rules that apply to the bank, its products, and the places it operates.

## 🟠 Credit, lending, and interest

- 🎓 **Interview-ready — Principal:** The amount borrowed or the outstanding amount before interest
  and fees.
  - 🧒 **Simple explanation:** It is the amount borrowed before adding interest and fees.
- 🎓 **Interview-ready — Interest:** The price paid for borrowing or earned on eligible deposits,
  calculated according to the product's rate, balance, and day-count rules.
  - 🧒 **Simple explanation:** It is the cost of borrowing money or the reward for keeping eligible savings in an account.
- 🎓 **Interview-ready — APR (Annual Percentage Rate):** A regulated or standardized annualized
  measure of borrowing cost in some jurisdictions. Its calculation and included
  charges vary by applicable rules; it is not always the same as the nominal
  interest rate.
  - 🧒 **Simple explanation:** It is a yearly way to compare borrowing costs, though the exact ingredients depend on local rules.
- 🎓 **Interview-ready — Annual percentage yield (APY) / AER:** Annualized measures of deposit
  return that may account for compounding. The name and calculation depend on
  jurisdiction.
  - 🧒 **Simple explanation:** It is a yearly way to describe savings growth, often including the effect of earning interest on interest.
- 🎓 **Interview-ready — Accrued interest:** Interest earned or owed over time but not yet posted or
  paid.
  - 🧒 **Simple explanation:** It is interest that has built up but has not yet been added to the account or paid.
- 🎓 **Interview-ready — Amortization:** Repayment over time through scheduled payments that reduce
  principal and cover interest and, where applicable, fees.
  - 🧒 **Simple explanation:** It is paying a loan down in planned installments that cover interest and gradually reduce what you owe.
- 🎓 **Interview-ready — Repayment schedule:** The planned due dates and amounts for loan payments.
  - 🧒 **Simple explanation:** It is the calendar showing when loan payments are due and how much to pay.
- 🎓 **Interview-ready — Delinquency / default:** A payment is overdue / a borrower has failed to
  meet obligations as defined by the contract and applicable rules. These are
  not necessarily interchangeable states.
  - 🧒 **Simple explanation:** Delinquency means a payment is late; default means a more serious failure defined by the loan agreement and rules.
- 🎓 **Interview-ready — Credit bureau / credit reference agency:** An organization that collects
  and provides credit history or risk information, subject to local law.
  - 🧒 **Simple explanation:** It is an organization that keeps or shares information about how people have used credit.
- 🎓 **Interview-ready — Affordability / creditworthiness assessment:** Evaluation of whether a
  customer can reasonably repay and the likelihood they will repay, under
  applicable requirements.
  - 🧒 **Simple explanation:** It checks whether a person is likely to manage the repayments and whether they are likely to repay.

## 🟦 Fintech and platform concepts

- 🎓 **Interview-ready — Core banking system:** The central platform that maintains customer
  accounts, balances, transactions, and often product rules.
  - 🧒 **Simple explanation:** It is the bank's central computer system for accounts, balances, transactions, and product rules.
- 🎓 **Interview-ready — Banking-as-a-Service (BaaS):** A model in which a regulated financial
  institution provides banking capabilities through a partner or APIs. The
  parties' responsibilities and customer disclosures must be clear.
  - 🧒 **Simple explanation:** It is when a regulated bank provides banking tools that another company offers through its own app or service.
- 🎓 **Interview-ready — Payment service provider (PSP):** A provider that enables businesses or
  customers to accept, initiate, or process payments.
  - 🧒 **Simple explanation:** It is a company that helps businesses or people accept, send, or process payments.
- 🎓 **Interview-ready — Processor:** A technology or service provider that handles payment
  transaction data and routing; the term can refer to different roles in
  different payment flows.
  - 🧒 **Simple explanation:** It is a technology helper that handles payment details and routes them to the right places.
- 🎓 **Interview-ready — API (application programming interface):** A defined interface through
  which systems exchange requests and data. Financial APIs need clear
  authentication, authorization, validation, idempotency, and error semantics.
  - 🧒 **Simple explanation:** It is a set of agreed doors and instructions that let computer systems talk to each other.
- 🎓 **Interview-ready — Webhook:** An event notification sent from one system to another. Delivery
  can be delayed, duplicated, or out of order, so consumers should verify
  authenticity and handle retries idempotently.
  - 🧒 **Simple explanation:** It is an automatic message one computer sends another when something happens; the receiver must be ready for repeats or delays.
- 🎓 **Interview-ready — Eventual consistency:** A system state may take time to become consistent
  across services. A successful response from one service does not guarantee
  every read model or downstream system has updated immediately.
  - 🧒 **Simple explanation:** It means different parts of a computer system may take a little time to show the same latest information.
- 🎓 **Interview-ready — Reconciliation file / statement:** A file or report from a bank, scheme,
  or processor used to match external activity to internal records.
  - 🧒 **Simple explanation:** It is a report from another system that the bank compares with its own records.
- 🎓 **Interview-ready — Safeguarding:** Protecting customer funds held by certain payment or
  e-money firms, typically through legally specified separation or protection
  arrangements. It is distinct from a bank deposit guarantee.
  - 🧒 **Simple explanation:** It means protecting certain payment-company customer funds by keeping them protected as the law requires.
- 🎓 **Interview-ready — E-money (electronic money):** Electronically stored monetary value
  represented by a claim on an issuer and issued under applicable e-money
  rules. It is not automatically a bank deposit.
  - 🧒 **Simple explanation:** It is electronic value owed by its issuer; it is not automatically the same as money in a bank deposit account.
- 🎓 **Interview-ready — Deposit guarantee:** A jurisdiction-specific protection for eligible bank
  deposits up to defined limits and conditions. Coverage does not automatically
  apply to every fintech balance, e-money product, or investment.
  - 🧒 **Simple explanation:** It is a safety promise under local rules that may protect eligible bank savings up to a set amount.

## 🟩 Banking and fintech QA essentials

- 🎓 **Interview-ready — Happy path:** The expected successful flow with valid inputs and normal
  conditions.
  - 🧒 **Simple explanation:** It is the smooth, expected journey when everything works and the information is correct.
- 🎓 **Interview-ready — Negative testing:** Verifying behavior for invalid, unauthorized,
  prohibited, or otherwise failing inputs and states.
  - 🧒 **Simple explanation:** It checks that the system responds safely when someone gives bad information or tries something not allowed.
- 🎓 **Interview-ready — Boundary testing:** Testing values at, below, and above limits, such as
  minimum/maximum payment amounts, character limits, and daily thresholds.
  - 🧒 **Simple explanation:** It checks right around the edges of a limit, like the smallest and largest amounts allowed.
- 🎓 **Interview-ready — State-transition testing:** Checking that an entity moves only through
  permitted lifecycle states and that each transition has the right side
  effects.
  - 🧒 **Simple explanation:** It checks that a payment or account moves through the right steps in the right order.
- 🎓 **Interview-ready — Ledger invariant:** A condition that must always hold, such as balanced
  double-entry postings, unique transaction references, or no spend beyond
  available funds (unless an overdraft is allowed).
  - 🧒 **Simple explanation:** It is a rule the money records must always obey, such as both sides of an entry balancing.
- 🎓 **Interview-ready — At-most-once financial effect:** A retry or duplicate message must not
  create a second charge, transfer, refund, or ledger posting.
  - 🧒 **Simple explanation:** It means a repeated message cannot accidentally create a second payment or refund.
- 🎓 **Interview-ready — Race condition:** A timing issue where concurrent requests can produce an
  incorrect result, such as two withdrawals both spending the same available
  balance.
  - 🧒 **Simple explanation:** It is a timing problem, like two people spending the same last dollar at nearly the same moment.
- 🎓 **Interview-ready — Reversal and retry testing:** Verify that timeouts, downstream failures,
  duplicate callbacks, and retries do not lose or duplicate money, and that
  eventual recovery is auditable.
  - 🧒 **Simple explanation:** It checks that trying again after a problem does not lose the money or move it twice.
- 🎓 **Interview-ready — Reconciliation testing:** Compare generated internal records with
  simulated bank, scheme, or processor records; verify matched, unmatched,
  duplicate, and amount/currency-mismatch handling.
  - 🧒 **Simple explanation:** It checks that the system can match its records to a bank or payment-provider report and spot differences.
- 🎓 **Interview-ready — KYC testing:** Cover successful verification, failed and inconclusive
  checks, document expiry, name/address mismatch, unsupported documents,
  provider timeouts, retries, manual review, resubmission, and resulting account
  restrictions. Use synthetic data and approved test environments.
  - 🧒 **Simple explanation:** It checks both successful identity checks and tricky cases like missing documents, timeouts, and manual review.
- 🎓 **Interview-ready — AML testing:** Validate risk rules and workflows with approved test
  scenarios: expected alerts, non-alerts, escalation, case assignment,
  dispositions, audit history, and reporting controls. Do not use real
  suspicious-activity data in ordinary test environments.
  - 🧒 **Simple explanation:** It checks whether approved test scenarios create the right alerts and whether staff can investigate them properly.
- 🎓 **Interview-ready — Sanctions-screening testing:** Verify exact and near matches, false
  positives, list updates, blocked/review outcomes, and auditability using
  approved test data and procedures.
  - 🧒 **Simple explanation:** It checks that likely matches are reviewed or blocked correctly, without treating every similar name as a match.
- 🎓 **Interview-ready — SCA testing:** Cover challenge-required and frictionless flows, valid and
  failed authentication, cancellation, timeout, exemption eligibility and
  rejection, step-up authentication, and behavior when the authentication
  provider is unavailable.
  - 🧒 **Simple explanation:** It checks successful and failed customer checks, exceptions, timeouts, and what happens if the provider is unavailable.
- 🎓 **Interview-ready — ISO 20022 testing:** Validate message schema and mandatory fields,
  identifiers, currency/amount precision, code sets, structured remittance,
  character handling, version compatibility, and correct mapping to/from
  internal models. Test rejection of malformed messages and safe handling of
  unknown optional data.
  - 🧒 **Simple explanation:** It checks that payment messages use the right format and that important details arrive intact.
- 🎓 **Interview-ready — Audit trail:** A tamper-evident record of who or what did an action, when,
  and with what outcome. It should support investigation without exposing
  secrets or unnecessary personal data.
  - 🧒 **Simple explanation:** It is a trustworthy history showing who did what and when, without exposing private secrets.
- 🎓 **Interview-ready — Test data masking:** Replacing or obscuring sensitive values while
  preserving enough structure for testing. Synthetic data is preferred for
  financial and identity workflows.
  - 🧒 **Simple explanation:** It hides real private details in test data while keeping enough shape for safe testing.
- 🎓 **Interview-ready — Operational resilience:** The ability to continue or recover critical
  services through failures, including clear handling of degraded operation,
  duplicate events, backlogs, and recovery.
  - 🧒 **Simple explanation:** It is the ability to keep important services working or recover them when something breaks.
- 🎓 **Interview-ready — Business invariant:** A non-negotiable domain rule expressed in a way that
  can be asserted in tests, such as “a completed transfer has one debit and one
  corresponding credit, in the same currency and amount.”
  - 🧒 **Simple explanation:** It is a must-always-be-true rule, like a completed transfer taking the same amount from one side and adding it to the other.

## 💡 A useful way to reason about any money movement

For each flow, identify:

1. **Who** owns the source and destination accounts, and who is authorized to
   act?
2. **What** amount, currency, fees, reference, and payment rail are involved?
3. **When** does the request become pending, authorized, posted, and settled?
4. **Which balance** changes at each stage, and what happens to holds?
5. **What can fail** (validation, limits, authentication, screening, network,
   downstream provider), and is the outcome retryable?
6. **How is correctness proven** (ledger entries, idempotency, audit trail,
   reconciliation, and customer-visible status)?
