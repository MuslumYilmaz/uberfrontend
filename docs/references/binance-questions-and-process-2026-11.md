# Binance: reported frontend interview questions and interview process

> Working record started on 2026-11-18. It lists the frontend interview questions and tasks that public interview reports attribute to Binance, with a source and access status for every item. It also lists the interview stages that those reports and Binance's own pages describe, and what this evidence lacks compared with the other 32 company pages.
>
> Companion documents:
> - `docs/references/disney-questions-and-process-2026-11.md` and `docs/references/cloudflare-questions-and-process-2026-11.md` use the same format.
> - `docs/references/company-pages-plan-2026-10.md` describes how a company page is built and the candidate selection rule.
> - `reports/company-candidates-research-2026-11-16.md` is the candidate round (git-excluded).
>
> The user chose Binance on 2026-11-18 (with Deel) and asked for this record only. The questions and the page were built from it on 2026-11-20 and 2026-11-21; see Status.
>
> **Buyers caveat, accepted by the user on 2026-11-18.** The evidence is Taiwan- and mainland-China-based and written in Chinese; the open frontend postings are in Hong Kong, Singapore and Taiwan. The selection rule puts US, Europe and SEA-relocation candidates first, so Binance sits outside its default lane the way Shopee does. Quotes are kept in the original Chinese with an English gloss outside the quotation marks, as in the Shopee record.
>
> **Scope decision, 2026-11-18.** Taiwan and mainland-China loops are in scope, including the one campus-style account, as separate variants.
>
> **Update 2026-11-18 (the user's premium-buyer review).** The question list was read as a paying reader would read it after the unlock. Twelve rows that named only a topic, a format or a generic exercise were removed from the list (Q16, Q22, Q29, Q43, Q45, Q47, Q50, Q51, Q52, Q53, Q60, Q64; their topics moved into the process-table stage cells), four rows were merged into their neighbours (Q9 into Q8, Q14 into Q13, Q21 into Q5, Q35 into Q34), Q38 lost its React new features half, and rows that rest on a card's first line or a scenario the source does not give are marked "topic". Row numbers are stable; the Count section lists every change with its reason. The CDN question inside Q26 and the WebSocket topics of B3 stay out of the list as questions (B3 names topics, not questions); the WebSocket consumer question that remains is the order book (Q46).

## Why Binance (2026-11-16, re-checked 2026-11-18)

- **Not covered.** No frontend prep site has a Binance company page. Lists read on 2026-11-16: GreatFrontEnd 37 company guides (sitemap read in Chrome), Front End Interview Handbook 36, FrontendLead 251, devtools.tech 43, frontendgeek 43 URLs, LearnersBucket 6. PracHub lists no Binance experiences. Dataford, Prepfully, InterviewPal, NodeFlair and HiredVoices have templated or AI-written Binance pages; they are not counted as coverage.
- **Demand.** Nine distinct Google autocomplete suggestions name Binance with a frontend term across the four templates of the 2026-10-26 method: `binance accelerator program frontend engineer`, `binance frontend developer salary`, `binance frontend engineer`, `binance frontend engineer interview`, `binance frontend engineer salary`, `binance frontend interview`, `binance frontend interview questions`, `binance senior frontend engineer salary`, `frontend developer binance`. Bing gives none. Same-day calibration (2026-11-16): Agoda 19, Walmart 17, JPMorgan 15, Tesla 14, Revolut 13, Cloudflare 7, Disney 5, ElevenLabs 2.
- **Hiring on the day (2026-11-16, Greenhouse `binance`, 224 open jobs).** Three frontend-titled postings, all updated 2026-11-16 (P1 to P3 below): Frontend Engineer - KYC (Hong Kong; Singapore; Taiwan), Senior Frontend Engineer - Web3 Wallet (Hong Kong; Singapore; Taiwan), Full Stack Engineer (Web, Frontend Oriented) for the AI facial recognition product (Australia; Hong Kong; New Zealand; Singapore; Taiwan; United Arab Emirates). Six adjacent postings name full stack, web or React. Lever `binance` lists 4 postings, none frontend-titled; the `jobs.lever.co/binance` frontend links in search results are stale.
- **Readable sources.**
  - Taro: none. No `/companies/binance` URL exists in the 21 local copies of Taro's experience sitemaps (612 company slugs; Coinbase is the only exchange) nor in the sitemap index.
  - First-person frontend accounts, all outside Taro: seven read in full (B1 Juejin 2020, B2 Medium 2021, B3 PTT 2021, B4 interview.tw 2022, B5 and B6 GoodJob 2021 and 2024, B7 Hacker News 2022), two sentence-level (B8 a Blind reply 2022, B9 a PTT comment 2021), eleven interview.tw cards whose loop text is locked (C1 to C11, 2020 to 2022), and two Blind question posts without answers (QP1 2026, QP2 2022).
  - Fifteen non-frontend accounts and insider remarks corroborate the loop (G1 to G15: PTT, GoodJob, Blind, V2EX, Nowcoder).
  - Official: the careers page and a Binance Square post about the Accelerator Program (O1, O2), plus the three postings. None describes an engineering round.
- **Buyers.** Accounts from Taiwan (Taipei, New Taipei, remote), mainland China, a senior frontend candidate of unstated location on Blind (B8) and a candidate of unstated location (B7). Singapore appears in a question post (QP2) and a 2020 general-SWE thread (G8). Interviewers are described as mainland Chinese in six sources; a June 2025 referral post says the working language is mainly Chinese (G14).
- **Page 1 (read 2026-11-16, logged out, hl=en).** `binance frontend interview questions`: Glassdoor (three country mirrors), an AI Overview, Dataford, InterviewPal, NodeFlair, a Blind company listing, Interview Solver and a Binance Square blockchain post. `binance frontend engineer interview`: the same plus HiredVoices and a web3.career posting. No editorial frontend guide and no authority site (GreatFrontEnd's quiz page is cited inside the AI Overview only).

## Research rules

- **Access codes.**
  - F: read in full.
  - S: sentence-level (a search snippet, a comment, or a card that shows its first lines only).
  - U: unreadable.
  - P: seen in search results only, or a prep site's question page.
  - T: read in full, but on a prep site's own page. Corroboration only, never counted as a report.
  - (c): a commenter's own account.
- **Quotes.**
  - Every quote comes from a saved page under `research_notes/company-candidates-2026-11-16/raw/binance/` (git-excluded; 111 files, URL on the first line). `research_notes/check_binance_quotes_2026-11-18.mjs` checks every quoted phrase in this file against those saves.
  - Chinese quotes stay in the original script (Traditional for Taiwan sources, Simplified for mainland sources); the English gloss follows outside the quotation marks and is ours.
  - Blind pages were read by curl (the post and its visible comments sit in a JSON-LD block); WebFetch answers 402 on Blind. PTT, GoodJob, interview.tw, Juejin, V2EX, Nowcoder and the Greenhouse and Lever boards were read by curl. The Medium post was read through the author's RSS feed (the page answers 403). binance.com was read through WebFetch only (curl gets a challenge page), so O1 and O2 are S.
  - Search summaries were used only to find pages.
- **Not cited.** Glassdoor, Dataford, Prepfully, InterviewPal, NodeFlair, HiredVoices and other templated pages. Reddit was not reachable. LeetCode Discuss was not read (one Binance post, probably backend, is listed under Needs the user).
- **interview.tw and GoodJob.** Both are Taiwanese crowdsourced sites. interview.tw cards show the role, the interview month, the format, the outcome, a difficulty rating, the first lines of the account and the first question; the rest is behind a points or VIP wall. One card (B4) is a featured card whose four rounds are rendered on the company listing page. GoodJob cards show the whole account, which is usually two or three sentences. Dates on both sites are self-reported by the posters.
- **Taro.** No pages exist, so there are no Glassdoor re-hosts to deduplicate.
- **Requests.** Requests carried a generic browser User-Agent and no personal data.
- **Scope.**
  - Web frontend roles, 2020 onward: frontend engineer, senior frontend engineer and frontend-oriented full stack titles.
  - Generic software-engineer loops are counted only as contrast (G rows).
  - The question list counts a question by its content, whoever was asked: frontend and general questions are listed, backend, infrastructure and systems questions are not (the user's rule of 2026-11-12).

## Method

1. **Community sources (2026-11-16).** A research reader used WebSearch (16 calls) and curl or WebFetch.
   - Blind: the company listing, 20 post pages and 7 search pages by curl. Two frontend question posts (QP1, QP2), one frontend reply (B8) and six general threads (G8 to G12) are in the tables.
   - PTT Soft_Job: six articles; one frontend account (B3) with a frontend comment (B9), one backend account (G1), one Android account (G13).
   - GoodJob: the Binance list (22 cards over four pages) and 24 experience pages; two frontend cards (B5, B6) and six general cards (G2 to G7).
   - interview.tw: the company listing (four pages), one featured card rendered in full (B4) and twelve experience pages (C1 to C11 and B4's stub).
   - Juejin: five search pages and two posts; one names Binance (B1).
   - Medium: the author's RSS feed (B2); two other Medium posts were unreadable (403) or not Binance-related.
   - Hacker News: Algolia queries for "binance interview" and "binance frontend"; one comment with a take-home brief (B7).
   - Nowcoder (two backend 面经, G15), V2EX (a referral post, G14), techprep.app (T).
   - GitHub repository search: no Binance take-home solutions; the hits are other companies' assignments that use the Binance API.
2. **Postings and official pages.** Greenhouse `binance` JSON (224 jobs, with descriptions) and Lever `binance` JSON; the careers page and the Square post through WebFetch.
3. **Catalog.** The 221 coding and debug items, 27 system designs and the trivia lists in `cdn/questions` were read on 2026-11-18, without edits. Pins were read from `backend/content/interview/authoring/*.json` (68 ids).
4. **Comparison.** The stage names of all 32 company process tables were loaded from `frontend/src/app/shared/company-previews/company-interview-processes.ts` with `frontend/scripts/load-ts-module.mjs` on 2026-11-18 and grouped by keyword, so the counts are approximate.
5. **Verification.** Every quotation in this file was checked by script against the saved pages (see Verification).

## Verdict

- **Binance runs a remote, Mandarin-leaning loop of three technical video rounds plus HR, with a fourth technical round when a team is hiring.**
  - B2 (Taiwan, 2020-07, offer): "全程遠端，HR安排面試 ➡️ 3輪Tech phone interview ➡️ 1輪HR" (fully remote: HR schedules the interviews, three technical phone rounds, one HR round). "比較特別的是3輪面試都是遠端進行，我遇到的面試官有台灣人也有中國人。" (all three rounds were remote; the interviewers were Taiwanese and mainland Chinese).
  - B3 (Taiwan, 2021-02, offer, referral): "原訂是三面技術面，由於內推的部門主管沒有面過，所以加了第四技術面" (three technical rounds were planned; a fourth was added because the referring department head had not interviewed the candidate). "Binance每一關大概1-2小時就會收到通知有沒有通過，非常效率！" (each round's result arrived within one to two hours).
  - B4 (2022-05, hired): "基本上三面，但因他們某個 team 在招人，故通過二面的會優先到該 team 面試，而我被刷掉，故才有第四面。" (basically three rounds, but a team that was hiring got first pick of candidates who passed round two; that team rejected the candidate, hence a fourth round).
  - Official: "On average 2~4 week interview process with 4 interviews." (O1).
  - Contrast: general software loops report "正常到最後會有四輪(HR+2個技術關+主管)" (normally four rounds: HR, two technical rounds and a manager; G4, 2025) and "總共三輪面試，有兩輪式技術面" (three rounds, two of them technical; G2, 2025).
- **The technical rounds are a drill on JavaScript and React internals, with short implementations on a shared editor.**
  - B4's advice: "幣安面試非常吃 JS 與 React 的底層理解。" (the Binance interview leans hard on the internals of JS and React) and "對於 JS 來說，一堆實作與 edge case 都要瞭解比較好；對於 React/Redux，需要看過實作原理。" (know the implementations and edge cases in JS; for React and Redux, have read how they are implemented).
  - B6 (senior, 2024-06): "面試過程就是不斷詢問各種問題，內容包含 CSS, React, Js, Frontend 相關技術如 Webpack, 演算法題目" (the interview was a continuous stream of questions on CSS, React, JS, frontend tooling such as Webpack, and algorithm problems) and "完全沒問履歷" (nothing about the résumé).
  - Implementations asked: a throttle, flatten without `flat`, dedupe without `Set`, `String.includes` (B4); a compose function with unknown arguments and a deep copy (B1); a modal and a tooltip component (B1); a component that fetches an API and renders a list, then list recycling (B4); hand-written Promise and `Promise.all`, a scroll debounce, quick sort (C1 to C4, first questions only).
  - Internals asked: React render and commit phases (B2), fiber and its scheduling (B1, B4, C8, C10), why hooks exist and why they cannot be conditional (B4), HOCs (B4), how `react-redux`'s `connect` passes data (B4), redux data flow and implementing redux (B1, B4), the event loop with a `setTimeout`/`Promise` ordering snippet (B4), event delegation, capture and bubbling (B3), closures (B1), `typeof` and `instanceof` (B4).
- **One trading-floor question recurs: high-frequency data on the screen.**
  - B4 (2022): "以此網頁 (https://www.binance.com/zh-CN/trade/BTC_USDT?type=spot) 旁的掛單簿為例，server 用 socket 推送大量數據，身為前端會怎麼處理這大量資料，兼顧效能及使用者體驗?" (take the order book on the spot trading page: the server pushes a large volume of data over a socket; as the frontend, how do you handle it for both performance and user experience?).
  - B3 (2021): "SSR / CSR / bundler / performance / websocket /http 相關知識" in round three and "websocket / cdn / cors / redux / error catch / async 相關知識" in the final round.
  - B9 (2021, a staff-leaning opening through a headhunter): a take-home to implement a K-line chart and a live-updating price table without libraries: "幣安我拿到的作業相當困難，不准用任何library" and "實作K線圖還有一個隨時更新的幣值表".
  - Performance scenarios: "給你一個情境去優化個web app" (optimise a web app for a given scenario; B2), "若一個用戶說某個頁面很慢，你如何跟進該問題?" (a user says a page is slow: how do you follow it up?; B4), "如果用戶反饋性能問題，該如何去排錯，怎麼判斷是否真的性能問題或是用戶網路問題" (how to debug a reported performance problem and tell a real one from the user's network; B3).
- **Take-homes are team-dependent, not a stage.** B2 and B3 had none ("我沒收到作業欸 就3+1個技術面", I got no assignment, just 3+1 technical rounds; B3 replying to B9). B9 (2021) and B7 (2022, a full-stack CMS brief) had one. The Accelerator Program page lists "An online/ take-home assessment" among the possible steps (O2).
- **English is checked inside the loop, and Mandarin is the working language of most interviewers.**
  - B4 round four: "英文還可以嗎? 我們來對話看看" (is your English okay? let's have a conversation).
  - B3: "面試過程中，沒有特別提及語言需求" and "三面部分英文進行，主要還是中文為主喔" (no language requirement was mentioned; round three was partly in English, mostly Chinese).
  - B8 (senior frontend, location not stated, 2022): "The first interview so far was with someone from China and their English is very poor and hard to understand."
  - Contrast: "第一關 PhoneReview是全英文面試" (the first phone review was entirely in English; G3, Java, 2025), "準備建議都用英文(但這很看不同的Team)" (prepare in English, but it depends on the team; G4, 2025), "Probably because my chinese wasnt good enough" (G8, Singapore, 2020), "面試官幾乎都是中國人" (almost all interviewers were mainland Chinese; G6, 2021), "most of interviewers are chinese" (G11, 2026).
- **Algorithms appear, at easy to medium level.** B2 met LeetCode-style questions at all four companies in that write-up ("難度介於Easy~Medium"); B5 and B6 name "演算法" (algorithms); C3 is a quick sort; C11 (2020-01): "都是考演算法的，只有一題css" (all algorithms, one CSS question).
- **AI.** No official rule for candidates was found. The three frontend postings require AI tooling in the job: "Demonstrated experience in using AI tools and technologies in daily work to enhance productivity and innovation" (P1), "Proficient with AI-assisted development tools (Cursor / Claude Code / Copilot, etc" (P2, truncated in the posting), "Ability to leverage AI tools and technologies to enhance development efficiency" (P3). Every posting discloses Binance's own use: "We may use artificial intelligence (AI) tools to support parts of the hiring process, such as reviewing applications, analyzing resumes, or assessing responses" and "Final hiring decisions are ultimately made by humans."
- **Stack.** P1: "Must have experience with React and Vue; experience with other frontend frameworks is welcome." P3: "Build and maintain frontend features using React / TypeScript". P2: "Strong web fundamentals: HTML, CSS, React, JavaScript/TypeScript, browser rendering, networking, caching, and performance optimization". Reports ask Vue versus React (B4, C7) and React internals throughout.
- **Readiness.**
  - Enough for a sourced guide: seven full first-person accounts over 2020 to 2024, one of them a four-round question list (B4), a repeated real-time data question, repeated implementations, and the English check and Mandarin interviewers as facts no template carries.
  - Three limits: the newest full loop is 2022-05 (B6, 2024, is a two-sentence card); every full account is Taiwan or mainland China, so a US or European reader gets B7 and B8 only; the richest unread text is the locked part of the interview.tw cards (B4's remaining text and C1 to C11).

## Sources

Access: see Research rules. Detail: Q = names questions or a task, T = topics only, P = rounds or process only.

### Frontend accounts, read in full (F)

| id | source | role, location, outcome, as written | date | detail | notes |
|---|---|---|---|---|---|
| B1 | Juejin, Kisha, "京东、币安、字节跳动面试总结" (JD, Binance and ByteDance interview summary), https://juejin.cn/post/6844904096948813832 | frontend (author profile 前端开发工程师); location not stated, mainland China by the companies in the same write-up; outcome not stated | 2020-03-19 | Q | Two rounds (一面, 二面). Round one: "写一个compose函数，参数未知（arguments, promise)", "写深拷贝", "解释一下闭包，以及闭包获取外层函数定义的变量的原理", "react hook以及fiber", "fiber的三大排序策略", "redux是用来做什么的，写一下redux处理数据的流程", "有没有碰到过redux处理数据的一些性能问题", "自己实现redux框架，说思路", "发布订阅模式，单例模式", "发布订阅模式，怎样监听事件，监听什么样的事件", "实现权限管理（路由权限管理，页面权限管理，页面导航栏部分展示）", "比如如果有个页面侧边导航栏需要向不同的人展示不同的选项，怎么实现？". Round two: "自己实现一个modal及tooplie组件，要求写，没写出来", "modal组件应该放到body里还是父的div？为什么？（弹框遮罩）tooplie组件如果放到body怎样对元素定位", "怎样实现的文件上传", "文件上传时的拖拽功能怎么实现", "文件上传的进度条怎样实现", "文件上传怎样实现预览功能、需要监听哪些事件", "之前做过的项目有什么亮点，或者比较有挑战性的事情" |
| B2 | Medium, 布魯斯前端, "2020 前端工程師面試 準備與心得（LINE Taiwan、17Live、Binance、Tiktok/ByteDance）", read through `https://medium.com/feed/@yixuntseng-bruce` | "所有面試的職位都是前端工程師/Frontend engineer。"; Taiwan, remote; "Binance：2020/07 (Offer Get)" | published 2021-01-09; interview 2020-07 | Q, P | About 1.5 years of frontend experience at the time. Channel: "HR LinkedIn上邀約" (an HR invitation on LinkedIn). Loop: "全程遠端，HR安排面試 ➡️ 3輪Tech phone interview ➡️ 1輪HR". "Binance的職缺都是遠端的職位，台北也有辦公室可以辦公，看個人興趣要不要去辦公室。" (all Binance openings are remote; a Taipei office is optional). Round one: "第一輪，主要是跟一位台灣前端面試，面試內容是對一些前端知識的討論，像是討論類似React的render階段跟commit階段分別做了什麼事情或者Redux狀態管理的討論等等，還有些JS白板題，算是中規中矩的面試，面試官人很好讚讚。" (a Taiwanese frontend engineer; React's render and commit phases, Redux state management, JS whiteboard questions). Round two: "第二輪跟上一輪面試給我的感覺差不多，只是這位面試官對性能優化的話題很熱情ＸＤ，問了很多這類的問題，像是給你一個情境去優化個web app" (an interviewer keen on performance: optimise a web app for a scenario). Round three: "第三輪是跟Binance前端業務的大主管面試，這一關可能因為前兩關已經把要問的基本問題都問完了，所以大多是履歷上的討論＋經驗的交流，最後來了個設計類型的題目，類似給你些個情境設計JS的Object等等" (the head of the frontend business: résumé and experience, then a design question: design a JS object for a scenario). "最後就是HR通知要發offer了，然後談談薪資這樣。" (HR announced the offer and discussed salary). "Binance工作是全遠端的模式" (fully remote work) |
| B3 | PTT Soft_Job, tyler90177, "[心得] 前端面試分享", https://www.ptt.cc/bbs/Soft_Job/M.1614929795.A.64E.html | frontend; Taiwan; "Binance(hunter介紹的朋友內推，2021/2)" (a referral through a headhunter's friend); offer, joined ("最後決定加入Binance") | 2021-03-05; interviews 2021-02 | Q, P | About four years of web work, two of them in frontend positions with a year of management. Round one: "codeShare進行一些online coding" and "event delegation / event loop / capture and bubbling / react底層相關知識". The invitation email promised algorithms, GC and bundler internals for round two; the round instead asked "react 如何進行效能優化(是個開放性問題，根據回答的方式深入討論" (how to optimise React performance, an open question), "react online coding", "ESnext new features / react new feature / react key 相關知識". Round three: "SSR / CSR / bundler / performance / websocket /http 相關知識" and "如果用戶反饋性能問題，該如何去排錯，怎麼判斷是否真的性能問題或是用戶網路問題". Final round: "websocket / cdn / cors / redux / error catch / async 相關知識". "Binance每一關大概1-2小時就會收到通知有沒有通過，非常效率！". Replies: "我沒收到作業欸 就3+1個技術面" (no take-home, 3+1 technical rounds); on language, "面試過程中，沒有特別提及語言需求" and "三面部分英文進行，主要還是中文為主喔"; salary can be taken in crypto ("他們薪水可以選擇拿加密貨幣很有趣") |
| B4 | interview.tw (面試趣), featured card "Frontend Engineer", rendered on the company listing https://interview.tw/c/CmbI; the card page https://interview.tw/i/627f6200290dd71496627d9d shows a stub | Frontend Engineer; video interview (視訊面試); hired (錄取); difficulty high (高); rating 4/5 | shared 2022-05-14; interview 2022-05 | Q, P | Four rounds rendered in full; "解鎖 1992 字完整內容" (1,992 more characters locked). Round one: "請寫一個 throttle", "React 為什麼要出 hook", "請舉一個為什麼要用 react HOC 的情境，與它的優點", "為什麼 react-redux 的 connect 可以把資料傳進 component 中", "請說明瀏覽器的緩存", "http status code 的 200 301 302 304 各是什麼意思", "React 為什麼要限制不能條件式使用 hook", "typeof 會拿到哪些值？", "instanceof 是做什麼用的？ 它會一直往原型鏈找嗎？". Round two: "解釋 String.includes() 是幹嘛的，若要你實現會怎麼寫?", "Array 的 forEach、map 與 reduce 各是幹嘛的?", "寫一個能攤平陣列的函式，例如輸入 [[1,2,3], [2,3,4]] 得到 [1,2,3,2,3,4]，不能使用 js 本身的 flat", "寫一個能去除陣列重複值的函式，例如輸入 [1,2,3,2,3,4] 得到 [1,2,3,4]，不能使用 js 的 set", "解釋 eventlop", a `setTimeout`/`Promise`/`then`/`console.log` ordering snippet, "setTimeout 的 log 為何是最後執行? 假如給 setTimeout 0 毫秒，實際時間是多少?", "解釋 redux 資料流", "說明 useMemo 與 useCallback", "有遇過 localstorage.get('name') 拿不到資料狀況嗎?", the order-book socket question, "如何確保後端給的 token 是安全的", "token 存在 localstorage 或 cookie，如何確保安全". Round three: "Vue 與 React 寫起來差異如何?", "Vue 與 React 的 state 改變能讓 UI 跟著改變，原理是什麼?", "若一個用戶說某個頁面很慢，你如何跟進該問題?", "延上，若該頁面真的很慢，能有哪些優化方式?", "SSR 原理理解嗎?", "Nodejs 碰過嗎?", "分享目前最大、最複雜、或對公司貢獻最多的專案". Round four (the hiring team): the interviewer's introduction and the day's plan, "說明待的公司在用的 E2E", the résumé's projects, "說明工作這幾年，最有成就的事", the move from an MIS degree to frontend, "為什麼想離職?", "知道微前端嗎?", a conditional-`useEffect` snippet ("以下這段 code 有什麼問題?"), "知道 react fiber 嗎? 它核心的功能是什麼?", "請說明一個頁面與 cache 有關的優化方式", "任何資源都可以 cache 嗎?", "若資源的 cache 時間到，都會再次發 request 嗎?", "頁面檔案也可以 cache 嗎?", "知道 CDN 嗎? 解釋", "請寫一個會 call API 拿資料，並顯示成一個列表的 component，僅寫最核心的 code", "若時間充裕，這個列表若根據用戶體驗或 code 的架構優化，你會做些什麼?", "關於列表的回收，若要你自己寫一套，會如何實作?", "對於 code review 有什麼看法?", "英文還可以嗎? 我們來對話看看", "若你加入幣安，你希望能獲得什麼?", the manager's rules for his reports, "在幣安，什麼樣的情況你會想離職?". Model answers on the card: "解釋 react-redux 的 context 機制。" and "解釋 memory cache / disk cache / sercive worker cache" |
| B5 | GoodJob, "幣安 前端工程師", https://www.goodjob.life/experiences/60fc213a6fcbb2001915730b | 前端工程師 (frontend engineer); New Taipei; not hired (未錄取); 5 years' experience; salary stated as 年薪 100萬 | shared 2021-07-24; interview 2021-07 | T | "疫情期間線上面試，有問到Js fundamental、演算法，第一關主考官是資深工程師，雖然他說是設計轉行的，但他基本知識非常扎實，大陸人" (online during the pandemic; JS fundamentals and algorithms; the first-round interviewer was a senior engineer from mainland China who had moved over from design). Advice: "如何準備面試：基本知識要扎實" (solid fundamentals); "其他注意事項：沒過的話也會給回饋，很感謝" (feedback is given after a rejection) |
| B6 | GoodJob, "幣安 SENIOR FRONTEND ENGINEER", https://www.goodjob.life/experiences/6685a098c7b004f2288fd178 | Senior Frontend Engineer; online (線上面試); not hired; 3 years' experience; rating 2.0 | shared 2024-07-03; interview 2024-06 | T | "面試過程就是不斷詢問各種問題，內容包含 CSS, React, Js, Frontend 相關技術如 Webpack, 演算法題目，總之必須要熟練各種前端知識技術才能回答得出來。" and "其他注意事項：完全沒問履歷，所以就是把基本功準備好，然後準備被問一連串的題目" (no résumé questions; prepare the fundamentals and expect a string of questions) |
| B7 | Hacker News, hrgiger, comment 31868750 in a thread about interview assignments, read through the Algolia items API | role and location not stated; "I skipped binance interview in the past" | 2022-06-24 | Q | The take-home brief, quoted in the comment: "Design and code a Content Management System (CMS) for Binance", with articles in 17 languages and per-article translations, "Design and code a RESTful API", "Design a user interface to facilitate this", "The preferred language for backend is Java and frontend is JavaScript", delivered as a public GitHub repository with a README. The candidate declined; a reply asks "They wanted you to write an entire content management system for them? For free?" |

### Frontend accounts, sentence-level (S)

| id | source | role, location | date | what it says |
|---|---|---|---|---|
| B8 | Blind, reply by r-zr6 in "Binance interview process" (OP yoloyol, a Europe-based backend applicant), https://www.teamblind.com/post/binance-interview-process-umfa8acz | "The interview is for a Senior Frontend Developer position."; location not stated | 2022-07-01 | "So far I've had bad experience with Binance." The recruiter set up the meeting without describing the process. "The first interview so far was with someone from China and their English is very poor and hard to understand." and "So when I was stuck on a problem and asked for hints he simply gave the answer away which is not what I wanted out of it." Content: "Basic frontend questions and Abstract Data Types and improving application using third party libraries without removing them from the project." and "I believe second interview there will be leetcodes" |
| B9 | PTT comment by satsuya0114 under B3 | frontend, a staff-leaning opening through a headhunter ("那可能我當初那個是算偏staff去的缺了（獵頭找的）QQ"); Taiwan | 2021-03-05 | "怪了 幣安我拿到的作業相當困難，不准用任何library" and "實作K線圖還有一個隨時更新的幣值表 所以就放棄惹 大" (the take-home was hard: implement a K-line chart and a live-updating price table without any library; the commenter gave up) |

### interview.tw cards with locked bodies (S, first lines only)

All are Binance frontend cards on the company listing; each shows its first process line and first question. Dates are the interview month given by the poster.

| id | card | role, format, outcome, difficulty | interview | visible text |
|---|---|---|---|---|
| C1 | https://interview.tw/i/5ff3ba8f4183ab59a50d05c2 | 前端工程師, Taipei, not hired, high | 2020-12 | "幣安為全遠端面試" (fully remote); "Javascript 非同步應用，Promise實作題一題" (asynchronous JS; one Promise implementation question) |
| C2 | https://interview.tw/i/625d9695c8661259db6f3467 | Frontend Engineer, video, not hired, average | 2022-03 | "兩關視訊面試" (two video rounds); "debounce function for scroll bar" |
| C3 | https://interview.tw/i/624febad9a3f73004c1c57a5 | 前端工程師, video, hired, average | 2022-04 | "此為第二階段技術面" (this was the second technical stage); "實作 quick sort" |
| C4 | https://interview.tw/i/6245173766582508ad355b92 | 前端工程師, video, not hired, high | 2022-03 | "面試約一小時" (about one hour); "手寫 promise all" (hand-write Promise.all) |
| C5 | https://interview.tw/i/623c88e5025bdc7d7f1109a4 | 前端工程師, video, not hired, high | 2022-03 | "要怎麼去實踐浮點數的判斷" (how to compare floating-point numbers); the answer line mentions "使用 Bigint" |
| C6 | https://interview.tw/i/623c006aeda3e930634b6ed4 | 前端工程師, video, hired, average | 2022-03 | "公司 CI/CD 的流程是什麼？" (what is your company's CI/CD process?) |
| C7 | https://interview.tw/i/6215d65c3574ad6fdb51afc8 | Frontend Engineer, video, not hired, high | 2022-02 | "Vue 渲染機制" (Vue's rendering mechanism) |
| C8 | https://interview.tw/i/610b7e758afc363af5252680 | 前端工程師, video, pending, very high | 2021-01 | "React底層" (React internals) |
| C9 | https://interview.tw/i/60fa38000f7e777983230932 | 前端工程師, video, pending, very high | 2021-07 | "Promise" |
| C10 | https://interview.tw/i/60c243d2b40bb84ab6418b82 | 前端工程師, Taipei, no reply, high | 2021-06 | "React fiber" |
| C11 | https://interview.tw/i/5e89e7e5db461001a3721e6c | 前端工程師, Taipei, no reply, very high | 2020-01 | "都是考演算法的，只有一題css" (all algorithms, one CSS question) |

### Frontend question posts without answers (F, no loop content)

| id | source | date | text |
|---|---|---|---|
| QP1 | Blind, BAANG, "Binance FrontEnd interview", https://www.teamblind.com/post/binance-frontend-interview-izmsl8qe | 2026-05-13 | "I'm going to start the FE interview process and I'm wondering if someone has recently going through it." No comments |
| QP2 | Blind, QIuC50, "Binance Frontend Singapore", https://www.teamblind.com/post/binance-frontend-singapore-o0viacdt | 2022-12-31 | "Anyone have any experience on this role at Singapore Binance?"; "TC: 150k". No comments |

### Non-frontend accounts and insider remarks (contrast only)

| id | source | role, location | date | what it says |
|---|---|---|---|---|
| G1 | PTT Soft_Job, nature2226, https://www.ptt.cc/bbs/Soft_Job/M.1614216007.A.3C7.html | 後端軟體工程師 (backend), Taiwan | 2021-02-25 | Four rounds: résumé, multithreading, system design, data structures; a cross interview; HR; the hiring manager; offer. Comment sabrinaz88: "面試官都問技術問重點" (interviewers asked focused technical questions), and the process was concise and short |
| G2 | GoodJob, https://www.goodjob.life/experiences/68126f6607e773897e3a2286 | 軟體工程師, online, not hired | 2025-04 | "總共三輪面試，有兩輪式技術面會有LeetCode 都是一題然後其他時間就是中國式技術八股文的考法" (three rounds; two technical rounds with one LeetCode problem each and otherwise mainland-style rote technical questions); the final round was the hiring manager; HR's round briefings did not match the rounds |
| G3 | GoodJob, https://www.goodjob.life/experiences/68bd3cf8b5fd01f7afe038c6 | JAVA工程師, online | 2025-07 | "第一關 PhoneReview是全英文面試" (the first phone review was entirely in English); pair programming in an online IDE: a sort plus Java language features |
| G4 | GoodJob, https://www.goodjob.life/experiences/68f2f350dea9de0ddbec012e | BAP-GOLANG ENGINEER (Accelerator Program) | 2025-08 | "正常到最後會有四輪(HR+2個技術關+主管)"; "準備建議都用英文(但這很看不同的Team)"; LeetCode plus a design question |
| G5 | GoodJob, https://www.goodjob.life/experiences/6193516680555f00120ac73c | 後端工程師 (backend), Taipei | 2021-11 | "線上考JS相關測試，主要都考ES6 (Class, proxy)" (an online JS test on ES6 classes and proxies); questions on hoisting, ES6 `Proxy` and "實作 eventemitter" (implement an EventEmitter) |
| G6 | GoodJob, https://www.goodjob.life/experiences/60d59db96fcbb20019047fcb | 軟體工程師 (Java), Taipei | 2021-06 | "面試官幾乎都是中國人"; multithreading, Spring Boot, SQL, GC, Redis, Kafka |
| G7 | GoodJob, https://www.goodjob.life/experiences/65fe4a1bccfdc07e85dbe5d3 | SDE, online, hired | 2021-04 | round one algorithms and Kubernetes; round two a résumé drill; "全遠端 壓力大" (fully remote, high pressure) |
| G8 | Blind, IRQu87, https://www.teamblind.com/post/interview-with-binance-how-many-technical-interviews-for-software-engineer-pahgk1s0 | Software Engineer, Singapore | 2020-12-09 | "Step1. HR screening", "Step2. Tech Interview round 1", "Step3. Tech Interview round 2"; reply bnsd890: "Easy ds and algo. They didnt get back to me. Probably because my chinese wasnt good enough" |
| G9 | Blind, XpsB71, https://www.teamblind.com/post/binance-interview-6uhx8iwq | SWE | 2023-03-03 | "first interview was LC and some language questions"; reply xvrT54: "a lot of language specifics, lc and no sys design", interviews on HackerRank, team-dependent |
| G10 | Blind, Amazon1239, https://www.teamblind.com/post/Binance-interview-process-wcZXYzFZ | software engineer | 2022-11-14 | "3 interviews"; reply lBej17: Java and Spring Boot fundamentals, one algorithm and SQL round |
| G11 | Blind, aRzd70, https://www.teamblind.com/post/binance-live-coding-interview-skk8fde3 | Senior SWE, backend-focused full stack; a 45 to 60 minute live coding round | 2026-05-11 | reply GQHA07 (2026-05-12): "Basic Cs knowledge + role specific stuffs" and "In general, the difficuties are lower than similar tech companies. Otherwise, most of interviewers are chinese" |
| G12 | Blind, notxj9, https://www.teamblind.com/post/why-is-the-binance-interview-so-sketchy-zoaeet0g | offer holder, 8 years, Taiwan | 2022-09-03 | office, team size, product, manager location and bonus were withheld during the loop |
| G13 | PTT Soft_Job (Android), https://www.ptt.cc/bbs/Soft_Job/M.1645631345.A.5AB.html | Android, mid level, Taiwan | 2022-02-23 | "Peer 面試2輪，manager面試1輪起跳" (two peer rounds, at least one manager round); principle-heavy questions |
| G14 | V2EX referral post, https://www.v2ex.com/t/1136400 | hiring context, bases Thailand, Dubai, Singapore, remote | 2025-06-04 | frontend hires: three years or more, "以 React 为主" (mainly React); on language, "工作语言的话 中文为主 英文可以读写就可以" (the working language is mainly Chinese; reading and writing English is enough) |
| G15 | Nowcoder, two backend 面经 found through the site search for 币安面经 | backend, mainland China | 2021 | binary-tree LCA, malloc, bitwise maximum; Dubbo load balancing. Nothing frontend |

### Postings (Greenhouse `binance`, open on 2026-11-16)

| id | title | locations | what it says |
|---|---|---|---|
| P1 | Frontend Engineer - KYC, job 5002661101 | Hong Kong; Singapore; Taiwan | "Must have experience with React and Vue; experience with other frontend frameworks is welcome."; web applications for internal teams, "including AI-driven products and other business-critical applications."; "Demonstrated experience in using AI tools and technologies in daily work to enhance productivity and innovation" |
| P2 | Full Stack Engineer (Web, Frontend Oriented) — AI Facial Recognition, Identity & Security, job 5007086101 | Australia; Hong Kong; New Zealand; Singapore; Taiwan; United Arab Emirates | "We are currently building an in-house AI facial recognition security product for KYC verification and user safety, replacing our existing third-party vendor solution."; "Strong web fundamentals: HTML, CSS, React, JavaScript/TypeScript, browser rendering, networking, caching, and performance optimization"; "Proficient with AI-assisted development tools (Cursor / Claude Code / Copilot, etc" |
| P3 | Senior Frontend Engineer - Web3 Wallet, job 5002553101 | Hong Kong; Singapore; Taiwan | "Build and maintain frontend features using React / TypeScript"; "Ability to leverage AI tools and technologies to enhance development efficiency" |

All three carry the hiring disclosure "We may use artificial intelligence (AI) tools to support parts of the hiring process, such as reviewing applications, analyzing resumes, or assessing responses" and "Final hiring decisions are ultimately made by humans." None describes the interview rounds.

### Official pages (S, read through WebFetch on 2026-11-16)

| id | page | what it says |
|---|---|---|
| O1 | https://www.binance.com/en/careers | "On average 2~4 week interview process with 4 interviews."; steps "01 Application Review", "02 Interviews", "03 Offer", "04 Onboarding"; nothing on assessments or candidates' AI use |
| O2 | https://www.binance.com/en/square/post/445767, "Kickstart Your Web3 Career Early With Binance" (Binance Blog; the Accelerator Program) | "Depending on the program, candidates must pass a comprehensive recruitment process, which may include the following:", "An online/ take-home assessment", "Interviews with a Talent Acquisition (TA)/ HR specialist/ Hiring Manager/ Business Unit lead and and Cross-Functional" (truncated by the fetch) |

### Unreadable or seen in search only (U, P)

- LeetCode Discuss post 7044945, titled Upcoming Binance Interview in search results (snippet: a Java framework test; probably backend).
- CSDN https://blog.csdn.net/zwldqp/article/details/104651002, a Binance frontend interview post (币安前端面试经验) that answers HTTP 521; the snippet lists React unsafe lifecycle methods, `setState` being asynchronous, redux `dispatch` and `createStore`, prototype traversal, `new Object` versus `Object.create`, a 30/70 A/B split.
- Zhihu https://zhuanlan.zhihu.com/p/101986056 (403; Binance relevance unknown).
- Medium, Huli, a 2020 senior front-end interview post (403; not in the author's feed; Binance relevance unknown).
- Glassdoor Binance Frontend Engineer and Front End Developer pages (not citable; snippets mention a Taipei interview in 2025-05, a referral loop in 2026-09 with a coding test, a lead interview and live coding, a staircase problem and a debounce function, a Senior Frontend in Dubai in 2024-10, and a Taipei interviewer who spoke only Mandarin).
- Templates (T): techprep.app's Binance interview-process page (backend-oriented; no dated or attributed quotes); Dataford, Prepfully, InterviewPal, NodeFlair, HiredVoices, refresh.cv (not read).

## Loop by level and region

### Frontend engineers, Taiwan and remote, 2020 to 2022 (B2, B3, B4, B5; C1 to C11)

- Channel: an HR invitation on LinkedIn (B2) or a referral through a headhunter's friend (B3); a headhunter for a staff-leaning opening (B9).
- Three technical phone rounds, then HR (B2); a fourth technical round when the head of the department the candidate was referred to has not interviewed (B3) or when a hiring team takes first pick of candidates who passed round two (B4). Each round's result within one to two hours (B3).
- Round one: fundamentals and short implementations on a shared editor (B3's codeShare; B4's throttle; B1's compose and deep copy); React internals and redux (B2, B4); C1's Promise implementation and C4's `Promise.all`.
- Round two: performance scenarios (B2, B3), implementations (B4's flatten, dedupe, `String.includes`), the event loop, redux, `useMemo` and `useCallback`, the order book over a socket, token security (B4).
- Round three: the head of the frontend business on the résumé and a design question (B2); SSR, CSR, bundlers, WebSocket, HTTP and performance triage (B3); Vue versus React, slow-page follow-up, SSR, Node.js, the biggest project (B4).
- Fourth round or team interview: WebSocket, CDN, CORS, redux, error handling and async (B3); E2E, micro-frontends, a conditional-hook snippet, fiber, cache and CDN, the API list component and list recycling, code review, the English conversation, motivation and the manager's rules (B4).
- Interviewers: Taiwanese and mainland Chinese (B2); a mainland senior engineer in round one (B5); mostly Chinese by other accounts.
- No take-home for B2 and B3; one for B9's staff-leaning opening.

### Senior frontend, online, 2024 (B6)

- A single continuous question drill across CSS, React, JS, Webpack and algorithms, with no résumé questions; the candidate (three years' experience) was not hired and rated the experience 2.0.

### Mainland-China frontend loop, 2020 (B1)

- Two technical rounds. Round one: compose, deep copy, closures, hooks and fiber scheduling, redux flow and performance, implementing redux, pub-sub and singleton patterns, permission management for routes, pages and navigation. Round two: a modal and a tooltip component written live (unfinished), mounting and positioning decisions, file upload with drag-and-drop, progress bar and preview, project highlights.

### Senior frontend candidate on Blind, location not stated, 2022 (B8)

- The recruiter set the meeting without describing the process. The first interview, with a China-based interviewer whose English was hard to follow, asked basic frontend questions, abstract data types and how to improve an application with third-party libraries without removing them; the candidate expected LeetCode in round two and did not report further.

### Take-homes (B7, B9; O2)

- A full-stack CMS brief with a REST API and a translations UI, Java backend and JavaScript frontend, declined (B7, 2022).
- A K-line chart plus a live-updating price table, no libraries, for a staff-leaning opening, abandoned (B9, 2021).
- The Accelerator Program lists an online or take-home assessment among its possible steps (O2). Four of the five full Taiwan accounts had none.

### Early career

- No first-person frontend account. The Accelerator Program page (O2) and a 2025 Golang account from the program (G4: four rounds, English advised, team-dependent) are the only evidence.

### Levels, locations and work model

- Experience at interview time: about 1.5 years (B2), about four years of web work (B3), five years (B5), three years for a senior title (B6); a staff-leaning opening (B9); senior titles in B6, B8 and P3.
- Locations as written: Taipei and New Taipei (C1, C10, C11, B5), remote Taiwan (B2, B3, B4), mainland China (B1), B8 gives no place (the thread's opening poster, a backend applicant, is in Europe), Singapore (QP2 question; G8 general), unstated (B7). Postings: Hong Kong, Singapore, Taiwan, plus Australia, New Zealand and the UAE for P2.
- Work model: fully remote with an optional Taipei office (B2); "幣安為全遠端面試" (C1); salary optionally in crypto (B3).
- Languages: Mandarin-speaking interviewers (B2, B5, B8, G6, G8, G11); an English conversation check (B4); partly English rounds (B3); an all-English first phone review for a Java role (G3).

## Reported questions

### Short implementations on a shared editor

- A throttle (B4, 2022). A debounce for a scroll bar (C2, 2022).
- Flatten one level without `Array.prototype.flat`; remove duplicates without `Set`; implement `String.includes` (B4, 2022).
- A compose function with unknown arguments; a deep copy (B1, 2020).
- A hand-written Promise (C1, 2020-12; C9, 2021-07) and `Promise.all` (C4, 2022-03).
- Quick sort (C3, 2022-04).
- Floating-point comparison, with `BigInt` in the answer (C5, 2022-03).
- A modal and a tooltip component, with the choice between mounting in `body` or the parent `div`, and how a tooltip mounted in `body` finds its element (B1, 2020).
- A component that calls an API and renders a list, core code only; then the UX and architecture improvements you would make with more time; then how you would write list recycling yourself (B4, 2022).

### JavaScript and the browser

- Closures and how a closure reaches variables of the outer function (B1).
- Event delegation, the event loop, capture and bubbling (B3).
- The event loop with a `setTimeout`, `Promise`, `then`, `console.log` ordering snippet; why the `setTimeout` log runs last; the real delay of `setTimeout` with 0 ms (B4).
- `typeof` values; what `instanceof` does and whether it walks the whole prototype chain (B4).
- `forEach`, `map` and `reduce` (B4). ESNext features (B3).
- `localStorage.get` returning nothing (B4).
- Token security: how to make sure the backend's token is safe; `localStorage` versus cookie (B4).
- Browser caches (memory, disk, service worker), HTTP 200, 301, 302 and 304, whether any resource can be cached, what happens when a cached resource expires, whether page files can be cached, what a CDN is (B4).
- Pub-sub and singleton patterns; which events to listen to (B1).
- Permission management for routes, pages and navigation; a sidebar that shows different items to different users (B1).
- File upload: drag-and-drop, a progress bar, a preview and the events to listen to (B1).

### React, Vue and tooling

- React's render phase versus commit phase (B2).
- Why React introduced hooks; why hooks cannot be called conditionally; what is wrong with a `useEffect` after an early `return` (B4).
- A situation for an HOC and its advantages (B4).
- How `react-redux`'s `connect` passes data into a component, answered with the context mechanism (B4).
- Redux: what it is for, the data flow, performance problems met, implementing redux yourself (B1); the redux data flow (B4); Redux state management (B2); redux in the final round (B3).
- Hooks and fiber; fiber's three scheduling strategies (B1); fiber's core purpose (B4); "React底層" and "React fiber" as first questions (C8, C10).
- `useMemo` versus `useCallback` (B4). React `key` (B3).
- Vue versus React in practice, and how a state change updates the UI in each (B4); Vue's rendering mechanism (C7).
- How to optimise React performance, an open question (B3); optimise a web app for a scenario (B2); follow up a user's slow-page report and list the optimisations (B4); tell a real performance problem from the user's network (B3).
- SSR and CSR, bundlers, how webpack works (B3); SSR (B4); Webpack (B6).
- Micro-frontends; E2E testing at your company; your view of code review (B4).

### Real-time data and trading UI

- The order book on the spot trading page: the server pushes a large volume of data over a socket; how the frontend handles it for performance and user experience (B4).
- WebSocket knowledge in two rounds (B3).
- A K-line chart and a live-updating price table without libraries, as a take-home (B9).

### Design and scenario questions

- Design a JS object for a given scenario, from the head of the frontend business (B2).
- Improving an application using third-party libraries without removing them from the project (B8).
- Abstract data types (B8).

### Algorithms

- LeetCode-style questions, easy to medium, met at all four companies in the same write-up (B2); algorithms (B5, B6); quick sort (C3); "都是考演算法的，只有一題css" (C11, 2020).

### Conversations

- The résumé and past experience with the head of the frontend business (B2); project highlights and the hardest thing you did (B1); the biggest, most complex or most valuable project (B4); your company's stack and its E2E setup (B4).
- Your greatest achievement in your working years; how you moved from an MIS degree into frontend; why you want to leave (B4).
- What you hope to gain at Binance; what would make you leave Binance; the manager's rules for his team (B4).
- An English conversation (B4).

### Take-homes

- The CMS brief: articles in 17 languages, per-article translations, a REST API, a UI, Java backend and JavaScript frontend, a public repository (B7).
- The K-line chart and live price table (B9).
- The Accelerator Program's online or take-home assessment (O2).

## The question list

One row per reported question or task, by content (the user's frontend-only rule of 2026-11-12): frontend and general questions stay, whoever was asked; backend, infrastructure and network-internals questions are left out and listed under Count. Rows whose source names only a format ("react online coding", "還有些JS白板題") are not listed; they go into the stage cells of the process tables (the user's decision of 2026-11-15). Round numbers are the poster's. Class: F full text, S sentence-level.

### A. Implementations and component builds

| # | Question or task | Round | Role, date | Source, class |
|---|---|---|---|---|
| Q1 | Write a throttle; a card's first line reports a debounce for a scroll bar (Q2 merged) | 1; ? | Frontend Engineer, 2022-05; Frontend Engineer, 2022-03 | B4, F; C2, S |
| Q3 | Flatten `[[1,2,3],[2,3,4]]` to one level without `flat` | 2 | Frontend Engineer, 2022-05 | B4, F |
| Q4 | Remove duplicates from `[1,2,3,2,3,4]` without `Set` | 2 | Frontend Engineer, 2022-05 | B4, F |
| Q5 | Warm-up pair: explain `String.includes` and write your own; what `forEach`, `map` and `reduce` each do (merged from Q21) | 2 | Frontend Engineer, 2022-05 | B4, F |
| Q6 | Write a compose function whose arguments are unknown (`arguments`, promises) | 1 | frontend, 2020-03 | B1, F |
| Q7 | Write a deep copy | 1 | frontend, 2020-03 | B1, F |
| Q8 | Hand-write a Promise (one Promise implementation question on asynchronous JS) and hand-write `Promise.all` (merged from Q9) | ? | 前端工程師, 2020-12; 2022-03 | C1, C4, S |
| Q11 | Implement a modal and a tooltip component; should the modal mount in `body` or the parent `div`, and how does a tooltip in `body` position itself | 2 | frontend, 2020-03 | B1, F |
| Q12 | File upload: how drag-and-drop works, how the progress bar works, how preview works and which events to listen to | 2 | frontend, 2020-03 | B1, F |
| Q13 | Write a component that calls an API and renders a list, core code only; then, with more time, what you would improve in that list for user experience or code architecture (merged from Q14) | 4 | Frontend Engineer, 2022-05 | B4, F |
| Q15 | How you would implement list recycling yourself | 4 | Frontend Engineer, 2022-05 | B4, F |

### B. JavaScript and browser questions

| # | Question | Round | Role, date | Source, class |
|---|---|---|---|---|
| Q17 | Explain closures and how a closure reads variables defined in the outer function; topic: common on every company page | 1 | frontend, 2020-03 | B1, F |
| Q18 | Event delegation, the event loop, capture and bubbling | 1 | frontend, 2021-02 | B3, F |
| Q19 | Explain the event loop; predict the order of a `setTimeout` / `new Promise` / `then` / `console.log` snippet; why the `setTimeout` log runs last; the real delay of `setTimeout` 0 | 2 | Frontend Engineer, 2022-05 | B4, F |
| Q20 | Which values `typeof` returns; what `instanceof` is for and whether it keeps walking the prototype chain | 1 | Frontend Engineer, 2022-05 | B4, F |
| Q23 | Have you met `localStorage.getItem` returning nothing for a key you expected (the candidate wrote it as `localstorage.get('name')`) | 2 | Frontend Engineer, 2022-05 | B4, F |
| Q24 | How to make sure the backend's token is safe; a token in `localStorage` or a cookie, how to keep it safe | 2 | Frontend Engineer, 2022-05 | B4, F |
| Q25 | Explain the browser cache (memory, disk, service worker); what HTTP 200, 301, 302 and 304 mean | 1 | Frontend Engineer, 2022-05 | B4, F |
| Q26 | A page optimisation that uses the cache; can every resource be cached; does an expired resource always trigger a request and return fresh data; can page files be cached; what a CDN is | 4 | Frontend Engineer, 2022-05 | B4, F |
| Q27 | Pub-sub and singleton patterns; in pub-sub, how you listen and to which events | 1 | frontend, 2020-03 | B1, F |
| Q28 | Permission management for routes, pages and navigation; a sidebar that shows different options to different users | 1 | frontend, 2020-03 | B1, F |

### C. React, Vue and tooling

| # | Question | Round | Role, date | Source, class |
|---|---|---|---|---|
| Q30 | What React's render phase and commit phase each do | 1 | frontend, 2020-07 | B2, F |
| Q31 | Why React introduced hooks; why hooks cannot be used conditionally; what is wrong with a `useEffect` after an early `return` | 1, 4 | Frontend Engineer, 2022-05 | B4, F |
| Q32 | A situation that calls for a React HOC, and its advantages | 1 | Frontend Engineer, 2022-05 | B4, F |
| Q33 | Why `react-redux`'s `connect` can pass data into a component (the context mechanism) | 1 | Frontend Engineer, 2022-05 | B4, F |
| Q34 | What redux is for; write out its data flow; performance problems met; how you would implement redux; the redux data flow and Redux state management asked again in 2020 and 2022 (merged from Q35) | 1; 2; 1 | frontend, 2020-03; Frontend Engineer, 2022-05; frontend, 2020-07 | B1, B4, B2, F |
| Q36 | React hooks and fiber; fiber's three scheduling strategies; what fiber's core function is | 1; 4 | frontend, 2020-03; Frontend Engineer, 2022-05 | B1, B4, F; C8, C10, S |
| Q37 | `useMemo` versus `useCallback` | 2 | Frontend Engineer, 2022-05 | B4, F |
| Q38 | React `key` (the row's React new features half was dropped as a topic) | 2 | frontend, 2021-02 | B3, F |
| Q39 | Vue versus React in practice; the principle by which a state change updates the UI in each; Vue's rendering mechanism | 3; ? | Frontend Engineer, 2022-05; 2022-02 | B4, F; C7, S |
| Q40 | How to optimise React performance (open question); optimise a web app for a scenario | 2; 2 | frontend, 2021-02; frontend, 2020-07 | B3, B2, F |
| Q41 | A user says a page is slow: how you follow it up, and which optimisations if it is slow; how to tell a real performance problem from the user's network | 3; 3 | Frontend Engineer, 2022-05; frontend, 2021-02 | B4, B3, F |
| Q42 | SSR and CSR; the SSR principle; bundlers and how webpack works; Webpack | 3; 3; ? | frontend, 2021-02; Frontend Engineer, 2022-05; senior, 2024-06 | B3, B4, B6, F |
| Q44 | Your company's E2E testing; your view of code review | 4 | Frontend Engineer, 2022-05 | B4, F |

### D. Real-time data and trading UI

| # | Question or task | Round | Role, date | Source, class |
|---|---|---|---|---|
| Q46 | The order book on the spot page: the server pushes a large volume of data over a socket; how the frontend handles it for performance and user experience | 2 | Frontend Engineer, 2022-05 | B4, F |
| Q48 | Take-home: a K-line chart and a live-updating price table, no libraries | take-home | frontend, staff-leaning, 2021 | B9, S |

### E. Design and scenario questions

| # | Question | Round | Role, date | Source, class |
|---|---|---|---|---|
| Q49 | Design a JS object for a given scenario; topic: the source does not give the scenario | 3 | frontend, 2020-07 | B2, F |

### F. Algorithms

No rows since the 2026-11-18 review: the algorithm evidence (B2's easy-to-medium LeetCode problems, B5's and B6's "演算法", C3's quick sort, C11's algorithm-only first round) names no problem, so it lives in the stage cells of the process tables and in the Reported questions prose.

### G. Take-homes

| # | Task | Role, date | Source, class |
|---|---|---|---|
| Q54 | Design and code a CMS with articles in 17 languages and per-article translations, a REST API and a UI (Java backend, JavaScript frontend), delivered as a public repository. Listed for its UI half; the API half is backend | role not stated, 2022-06 | B7, F |

### H. Conversations (open group)

| # | Question | Round | Role, date | Source, class |
|---|---|---|---|---|
| Q55 | Your résumé and experience, with the head of the frontend business | 3 | frontend, 2020-07 | B2, F |
| Q56 | Project highlights or the most challenging thing you did | 2 | frontend, 2020-03 | B1, F |
| Q57 | Your biggest, most complex or most valuable project; the projects on your résumé | 3, 4 | Frontend Engineer, 2022-05 | B4, F |
| Q58 | The technology and the E2E setup at your current company | 2, 4 | Frontend Engineer, 2022-05 | B4, F |
| Q59 | Your greatest achievement in your working years | 4 | Frontend Engineer, 2022-05 | B4, F |
| Q61 | Why you want to leave your job | 4 | Frontend Engineer, 2022-05 | B4, F |
| Q62 | What you hope to gain by joining Binance | 4 | Frontend Engineer, 2022-05 | B4, F |
| Q63 | What would make you leave Binance | 4 | Frontend Engineer, 2022-05 | B4, F |

### Count

- **Rows:** 46 listed of 65 numbered (after the 2026-11-18 reviews): A 10, B 9, C 12, D 2, E 1, F 0, G 1, H 8. The 19 missing numbers are the 14 removed and 5 merged rows below.
- **By content:** 38 frontend rows (A, B, C, D, E and the UI half of Q54), 8 general rows (H). Rows marked "topic" (Q17, Q49, and the card-stub parts of Q1, Q8, Q36 and Q39) give the subject without the exact question; Q48 rests on a comment (S). The Page package section below decides which rows the page locks (20) and which it shows as open topics (18).
- **Removed after the blind buyer read (2026-11-18, later):**
  - Q10, floating-point comparison with BigInt as the answer (C5): the card's own answer line would read as the guide's answer, and it is not the standard answer (a tolerance such as `Number.EPSILON` is); three readers flagged it as trust-damaging;
  - Q65, the English conversation (B4): a process fact, not a question; it stays in the fourth-round stage cell and in the Verdict, with prep guidance planned for the page.
- **Removed on 2026-11-18 (the user's review: a paying reader would see no question in them):**
  - Q16, quick sort (C3): a generic exercise named in a card's first line; now in the Technical round 2 stage cell;
  - Q22, ESNext new features (B3): a topic; now in the Technical round 2 stage cell;
  - Q29, basic frontend questions and abstract data types (B8): a summary, not a question;
  - Q43, micro-frontends (B4): a one-word topic; now in the fourth-round stage cell;
  - Q45, error handling, async, redux and CORS in the final round (B3): a topic list; now in the fourth-round stage cell;
  - Q47, WebSocket questions in rounds three and four (B3): topics; the stage cells keep them, the order book (Q46) is the WebSocket question that remains;
  - Q50, improving an application with third-party libraries (B8): the task is not stated;
  - Q51, Q52, Q53, algorithms (B2, B5, B6, C11): no problem named; now in the Technical round 1 stage cell;
  - Q60, how the candidate moved from an MIS degree into frontend (B4): personal to that candidate;
  - Q64, the manager's rules for his reports (B4): a statement, not a question.
- **Merged on 2026-11-18:** Q9 (Promise.all) into Q8; Q14 (list improvements) into Q13; Q21 (forEach, map, reduce) into Q5; Q35 (redux data flow) into Q34; later the same day Q2 (the scroll debounce card) into Q1, so the page shows throttle and debounce as one locked row with two practice tasks. **Trimmed:** Q38 keeps React `key` and loses React new features.
- **Left out by the frontend-only rule:** "Nodejs 碰過嗎?" (Node.js experience, B4 round three), "公司 CI/CD 的流程是什麼？" (the CI/CD process, C6), the API half of the CMS take-home (B7), the backend rounds in G1 to G15, and the HTTP, CDN and CORS questions of B3's rounds three and four except where B4 asks them at the browser-cache level (Q25, Q26). The CDN question inside Q26 ("知道 CDN 嗎? 解釋") stays because it is one link in a browser-cache chain of questions.
- **Not listed, format only (go into the stage cells):** "codeShare進行一些online coding" and "react online coding" (B3), the JS whiteboard questions of B2 ("還有些JS白板題"), "基本上三面" and the round structure of B4, "Peer 面試2輪，manager面試1輪起跳" (G13).
- **Most repeated:** redux (Q33, Q34: four accounts, 2020 to 2022); fiber and React internals (Q36: four sources); the performance scenario (Q40, Q41: three accounts); hand-written utilities (Q1 to Q8: four sources); real-time socket data (Q46, Q48, plus B3's WebSocket topics: three sources); algorithms (four sources, stage cells); the English check (the fourth-round stage cell, plus G3 and G4).
- **Source concentration, for the hero caveat:** about 30 of the 40 frontend rows come from one four-round account of 2022-05 (B4); the 2020 accounts (B1, B2), the 2021 account (B3) and the 2024 card (B6) corroborate the shape of the loop but add fewer exact questions.
- **Gaps for a page:** no round-by-round account after 2022-05; no account from Hong Kong or Singapore; no TypeScript, accessibility or CSS-layout question beyond C11's single CSS item; the order-book question has no reported answer; the locked card bodies (C1 to C11, the rest of B4).

## Official pages (read 2026-11-16)

- **Process.** Application review, interviews, offer, onboarding; "On average 2~4 week interview process with 4 interviews." (O1). The Accelerator Program may include an online or take-home assessment and interviews with TA or HR, the hiring manager, a business-unit lead and cross-functional interviewers (O2).
- **AI.** No rule for candidates. Binance's own use of AI in screening and assessment is disclosed on every posting, with the sentence that final decisions are made by humans. All three frontend postings require AI tooling in the job (P1 to P3).
- **Reapplying.** No rule or waiting period was found.
- **Engineering-specific text:** NOT FOUND. Nothing official describes coding rounds, take-homes, round content or language expectations.

## Comparison with the other 32 company pages

The stage names of all 32 process tables were loaded on 2026-11-18 and grouped by keyword, so the counts are approximate. Per-page facts come from the 2026-11-03 comparison in the Disney record (30 pages) where not re-measured.

### Process steps

| Stage type | Tables with it (of 32) | Binance evidence | Status for Binance |
|---|---|---|---|
| Recruiter or HR call | 30 | an HR invitation on LinkedIn and a closing HR round (B2); headhunter referrals (B3, B9); official "01 Application Review" | present |
| Hiring manager | 21 | the head of the frontend business in round three (B2); the referring department head's added round (B3); the hiring team's round with the manager's rules (B4); G4's manager round | present, as the last technical round |
| Online assessment | 19 | none in a frontend account; a backend online JS test (G5, 2021); the Accelerator Program's online or take-home assessment (O2) | thin |
| Technical or phone screen | 21 | every account is remote video; "3輪Tech phone interview" (B2) | present, the whole loop |
| Live, UI or machine coding | 12 | codeShare and "react online coding" (B3); throttle, flatten, dedupe, `String.includes`, the API list component (B4); compose, deep copy, modal and tooltip (B1) | present, strong |
| JavaScript and web fundamentals | 11 | B1, B3, B4, B5, B6; C1 to C10 | present, the core of the loop |
| Algorithms | 7 | B2, B5, B6, C3, C11; G2, G8, G9 | present, easy to medium |
| Frontend system design | 21 | no dedicated round; scenario questions inside rounds (Q46, Q49; B8's third-party-libraries question) | thin |
| Take-home and review | 9 | B7 (declined), B9 (abandoned), O2; none for B2 and B3 | team-dependent |
| Code review or debugging | 7 | none; B4 asks the candidate's view of code review | missing |
| Behavioral or values | 18 | B4 round four (why leave, what you want, when you would quit); B2's HR round; G4 | present, light |
| PM or product round | 4 | none | missing |
| Team match | 8 | a hiring team takes first pick after round two (B4) | present, in an unusual form |
| Decision or result | 9 | results within one to two hours per round (B3); feedback after rejection (B5); HR's offer call (B2) | present |
| English check inside the loop | 0 | B4; G3, G4 | Binance only |
| Mandarin-speaking interviewers | 0 | B2, B5, B8, G6, G8, G11; G14 on the working language | Binance only |

### Facts the other pages show

| Fact | On other pages (2026-11-03) | Binance | Status |
|---|---|---|---|
| Total duration | 8 of 29 tables | official "2~4 week" (O1); results within one to two hours per round (B3) | available |
| Round durations | 83 of 238 rows | "面試約一小時" (C4); a 45 to 60 minute live coding round for a backend-focused role (G11) | thin |
| Number of rounds | many tables | three technical plus HR (B2); 3+1 (B3, B4); official four (O1); four (G4) | available |
| Official process page | 28 of 30 pages | O1 (generic), O2 (program-specific) | available, generic |
| Interview AI rule | official on some pages | none for candidates; hiring-side disclosure and AI-tooling requirements in postings (P1 to P3) | partial |
| Reapply or cooling-off | official on some pages | none | missing |
| Levels | named on some tables | mid (B2, B3), senior (B6, B8, P3), staff-leaning (B9) | available |
| NDA | rare | none reported | - |
| Work model | some pages | fully remote with optional Taipei office (B2); remote interviews (C1); postings in HK, SG, TW | available |
| Languages | rare | the English check and Mandarin interviewers | available, distinctive |

### Question families

| Family | Typical on other pages | Binance | Status |
|---|---|---|---|
| React or UI build tasks | most pages | the API list component (Q13), modal and tooltip (Q11), the K-line take-home (Q48), the CMS UI (Q54) | present |
| JavaScript utilities and promises | many pages | throttle, debounce, flatten, dedupe, compose, deep copy, `String.includes`, Promise and `Promise.all` (Q1 to Q8) | present, strong |
| DOM and vanilla widgets | some | file upload with drag-and-drop (Q12); event delegation (Q18) | present |
| CSS and layout | some | one CSS question in a 2020 card (C11); CSS in the senior drill (B6) | thin |
| Accessibility | some | none | missing |
| Web security | some | token storage and safety (Q24) | present, narrow |
| Performance | some | optimise a web app, follow up a slow page, performance triage (Q40, Q41); the order book (Q46) | present, strong |
| Frontend system design prompt | many | a JS object for a scenario (Q49); list recycling (Q15); the order book (Q46) | thin |
| Debugging | some | the conditional-hook snippet (Q31) | thin |
| Code review | few | an opinion question only (Q44) | missing |
| React state and internals | many | render/commit, fiber, hooks rules, HOC, `connect`, redux, `useMemo`/`useCallback` (Q30 to Q37) | present, the strongest family |
| TypeScript typing | some | postings only (P2, P3) | missing in reports |
| Company and product knowledge | rare | the order book on Binance's own trading page (Q46); why join and what would make you leave (Q62, Q63) | present |
| Behavioral and values | most pages | B4 round four | present, light |
| Language check | none | the English conversation in the fourth round (B4; G3, G4) | Binance only |

### Page sections and plan data the other pages have

| Item | Other pages | What the Binance evidence supports |
|---|---|---|
| Hero caveat | every authored guide | the accounts are Taiwan- and China-based and written in Chinese; the newest full loop is 2022-05; no account from Hong Kong or Singapore; interviewers are mostly Mandarin speakers and an English conversation is checked |
| Round spotlight | 9 pages | the order-book socket question with the performance scenarios (Q46, Q40, Q41); second choice: the four-round question drill of B4 |
| Practice prompts | 4 to 7 per authored guide | a throttle and a flatten (Q1, Q3), the API list with recycling (Q13, Q15), the modal and tooltip (Q11), a socket-fed order book (Q46), a Promise.all (Q8) |
| Official guides table | 28 of 30 pages | O1 and O2 rows |
| Process table | 32 of 32 pages | two variants proposed below |
| Signature round (directory) | 32 of 32 (`company-signatures.ts`) | proposed below |
| Plan entry and profile | 32 of 32 (`company-plan-rounds.ts`, `company-plan-profiles.ts`) | inputs below |
| 7-day plan and FAQ | every authored guide | can be written from this record |

## Proposed interview process tables

The registry rule holds: a stage cites only sources read in full. Card stubs (C1 to C11), the comment B9, the Blind reply B8, the official pages (S) and templates are not cited in the tables; the page copy can describe them. None of the cited hosts (Medium, PTT, interview.tw, GoodJob, Juejin, Hacker News, Blind) is on the SSR test's banned list.

**Variant 1: frontend engineers, Taiwan and remote, 2020 to 2022 (B2, B3, B4; B5 for round one)**

| Stage | What happens | Who | Sources |
|---|---|---|---|
| HR contact | An HR invitation on LinkedIn or a referral; the interviews are remote and scheduled by HR | All | B2, B3 |
| Technical round 1 | Fundamentals with a frontend engineer: React's render and commit phases, redux, closures and the event loop, `typeof` and `instanceof`, browser cache and HTTP status codes; short implementations on a shared editor such as a throttle; JS whiteboard questions; in some loops an algorithm problem, easy to medium | All | B2, B3, B4, B5 |
| Technical round 2 | Implementations without built-ins (flatten, dedupe, `String.includes`), the event-loop ordering snippet, redux data flow, `useMemo` and `useCallback`, token storage, and the order-book question: how the frontend handles a socket that pushes a large volume of data; or an open question on optimising React performance, a React coding exercise and ESNext and React `key` questions | All | B2, B3, B4 |
| Technical round 3 | The head of the frontend business or a senior engineer: résumé and experience, a design question such as a JS object for a scenario, Vue versus React, following up a slow page, SSR and CSR, bundlers, WebSocket and HTTP | All | B2, B3, B4 |
| Team or fourth technical round | Added when a hiring team takes first pick after round two, or when the referring manager has not interviewed: micro-frontends, fiber, cache and CDN, a component that fetches an API and renders a list, list recycling, your view of code review, an English conversation, and why you want to join; in the 2021 loop, WebSocket, CORS, redux, error handling and async topics | Some candidates | B3, B4 |
| HR and offer | HR announces the offer and discusses salary; results arrive within one to two hours of each round | Candidates who pass | B2, B3 |

Proposed evidence labels (at most 28 characters):

| Stage | Label |
|---|---|
| HR contact | 2 public reports, 2020–21 |
| Technical round 1 | 4 public reports, 2020–22 |
| Technical round 2 | 3 public reports, 2020–22 |
| Technical round 3 | 3 public reports, 2020–22 |
| Team or fourth technical round | 2 public reports, 2021–22 |
| HR and offer | 2 public reports, 2020–21 |

**Variant 2: mainland-China frontend loop, 2020 (B1), with the 2024 senior drill (B6)**

| Stage | What happens | Who | Sources |
|---|---|---|---|
| Technical round 1 | Write a compose function and a deep copy; closures; hooks and fiber scheduling; redux flow, its performance and how to implement it; pub-sub and singleton patterns; permission management for routes, pages and navigation | All | B1 |
| Technical round 2 | Write a modal and a tooltip component live, and defend where they mount; file upload with drag-and-drop, a progress bar and a preview; project highlights | Candidates who pass round one | B1 |
| Senior question drill | A continuous stream of questions on CSS, React, JS, Webpack and algorithms, with no résumé questions | Senior candidates (2024) | B6 |

Labels: `One public report, 2020` for the first two rows and `One public report, 2024` for the third.

Not tabled: the take-homes (B7 is a full-stack brief with no loop; B9 is a comment), the Blind comment (B8, sentence-level) and the Accelerator Program (official S only). They belong in the page copy.

## Plan, signature and profile inputs (for the build step)

Proposals for `company-plan-rounds.ts`, `company-signatures.ts` and `company-plan-profiles.ts`; nothing is applied.

- **Plan lists.**
  - Variant 1: id `frontend`, `default: true`; reported levels mid (B2, B3) and senior (B6, B8).
  - Variant 2: id `china`, with an `ask` such as `Interviewing with a mainland-China team?`; `reported` mid.
- **Round kinds.**
  - Variant 1: HR contact `recruiter`; Technical rounds 1 to 3 `coding`; Team or fourth technical round `coding`; HR and offer `outcome`.
  - Variant 2: Technical round 1 `coding`; Technical round 2 `coding`; Senior question drill `coding`.
- **Signature round (directory).** `React internals drill`: four accounts from 2020 to 2024 describe a question stream on React internals, redux and JavaScript (B1, B2, B4, B6), and B4's own advice names it. Fallback: `Order book socket question`, the one trading-specific prompt (B4, with B3's WebSocket rounds and B9's take-home).
- **Profile.** `framework: 'react'`, `mixed: true`.
  - Evidence: every frontend account names React; P1 requires React and Vue; B4 and C7 ask Vue questions.
  - Aliases: `幣安`, `币安` (the Chinese names used by the Taiwan and mainland sources). Whether the plan should match them is a product decision.

## Catalog mapping proposal (not applied)

Counts were read from `cdn/questions` on 2026-11-18. Sources are capped at 6 per item; trivia cannot carry sources; the pins are the 68 ids found in the backend authoring registries.

The rules are the CrowdStrike record's:
- **Tag with a source:** an unpinned coding, debug or system-design item matching a task from a frontend-focused F report, with room under the cap.
- **Tag only:** a trivia item whose question is the reported question.
- **Link only:** everything else that helps.

### Tag with a source

| # | id | file | access | why it matches | source | sources now | pin |
|---|---|---|---|---|---|---|---|
| 1 | `js-throttle` | javascript/coding.json | premium | "請寫一個 throttle" opened B4's first round | B4 (2022) | 3 | unpinned |
| 2 | `js-flatten-once` | javascript/coding.json | free | B4's flatten of `[[1,2,3],[2,3,4]]` to one level without `flat` is exactly one level | B4 (2022) | 3 | unpinned |
| 3 | `js-deep-clone` | javascript/coding.json | premium | "写深拷贝" in B1's first round | B1 (2020) | 2 | unpinned |
| 4 | `js-compose` | javascript/coding.json | premium | "写一个compose函数，参数未知（arguments, promise)" in B1's first round | B1 (2020) | 0 | unpinned |
| 5 | `infinite-scroll-list` | system-design/index.json | free | B4's list recycling question ("關於列表的回收，若要你自己寫一套，會如何實作?") and the list improvements with more time; the note must say it practises the recycling step, not the reported component | B4 (2022) | 0 (companies datadog) | unpinned |

Draft source entries (label 8 to 120 characters, note at most 280; `binance` goes into `companies`):

```json
{
  "label": "interview.tw: Binance frontend engineer interview, Taiwan, 2022",
  "url": "https://interview.tw/c/CmbI",
  "company": "binance",
  "publisher": "interview.tw",
  "date": "2022-05",
  "note": "A four-round Binance frontend loop whose first round opened with writing a throttle. The card is rendered on the company listing page; its remaining text is locked."
}
```

```json
{
  "label": "Juejin: Binance frontend interview summary, 2020",
  "url": "https://juejin.cn/post/6844904096948813832",
  "company": "binance",
  "publisher": "Juejin",
  "date": "2020-03",
  "note": "A two-round Binance frontend loop in mainland China whose first round asked for a compose function with unknown arguments and a deep copy, next to closures, hooks, fiber and redux."
}
```

### Tag only (trivia)

| # | id | file | supporting account | reported question |
|---|---|---|---|---|
| 1 | `js-closures` | javascript/trivia.json | B1 (2020) | closures and how they reach the outer function's variables (Q17) |
| 2 | `js-event-loop` | javascript/trivia.json | B3 (2021), B4 (2022) | the event loop and the ordering snippet (Q18, Q19) |
| 3 | `js-microtasks-vs-macrotasks` | javascript/trivia.json | B4 (2022) | why the `setTimeout` log runs last after a Promise (Q19) |
| 4 | `js-check-data-type-with-typeof` | javascript/trivia.json | B4 (2022) | which values `typeof` returns (Q20) |
| 5 | `js-prototype-vs-proto` | javascript/trivia.json | B4 (2022) | whether `instanceof` walks the prototype chain (Q20) |
| 6 | `js-cookie-sessionstorage-localstorage` | javascript/trivia.json | B4 (2022) | a token in `localStorage` or a cookie (Q24) |
| 7 | `http-caching-basics` | javascript/trivia.json | B4 (2022) | the browser cache, 304, expiry and re-requests (Q25, Q26) |
| 8 | `debounce-vs-throttle-search-input` | javascript/trivia.json | B4 (2022), C2 (2022) | a throttle, a scroll debounce (Q1) |
| 9 | `sse-vs-websocket-real-time` | javascript/trivia.json | B3 (2021), B4 (2022) | the order book over a socket (Q46) and B3's WebSocket topics |
| 10 | `web-performance-optimize-load-time` | javascript/trivia.json | B2 (2020), B4 (2022) | optimise a web app for a scenario; a slow page and its optimisations (Q40, Q41) |
| 11 | `react-higher-order-components` | react/trivia.json | B4 (2022) | a situation for an HOC and its advantages (Q32) |
| 12 | `react-why-hooks-have-rules` | react/trivia.json | B4 (2022) | why hooks cannot be conditional; the `useEffect` after an early return (Q31) |
| 13 | `react-usememo-vs-usecallback` | react/trivia.json | B4 (2022) | `useMemo` versus `useCallback` (Q37) |
| 14 | `react-state-management-redux` | react/trivia.json | B1 (2020), B2 (2020), B4 (2022) | what redux is for and its data flow (Q34) |
| 15 | `react-ssr-hydration` | react/trivia.json | B3 (2021), B4 (2022) | SSR and CSR, the SSR principle (Q42) |
| 16 | `react-keys-in-lists` | react/trivia.json | B3 (2021) | React `key` (Q38) |
| 17 | `react-concurrent-rendering` | react/trivia.json | B1 (2020), B4 (2022) | fiber and its scheduling (Q36); the closest item, since no trivia explains fiber itself |
| 18 | `vue-internal-rendering-pipeline` | vue/trivia.json | B4 (2022), C7 (2022) | how a state change updates the UI in Vue; Vue's rendering mechanism (Q39) |

### Link only

- **Pinned items that match a task:** `js-debounce` (C2), `js-unique-array` (B4's dedupe, Q4), `js-event-emitter-mini` (B1's pub-sub questions, Q27; G5's "實作 eventemitter" is a backend account), `js-create-lru-cache` (none), `live-chart-high-frequency-updates` (the order book, Q46, and the K-line take-home, Q48), `image-upload-preview` (B1's file upload, Q12), `react-filterable-user-list` (none).
- **At the source cap:** `react-fetch-list-states` (6 sources) for B4's API list component (Q13), the closest item in the catalog; `react-autocomplete-search-starter` (6).
- **Promises:** `js-promise-all` (premium, 2 sources, unpinned) for C4's hand-written `Promise.all` and `js-create-deferred-promise` (free) for C1's Promise implementation (both Q8); both rest on card stubs (S), so a link, not a tag.
- **Components:** `html-dialog-confirm-a11y` (premium) for the modal half of Q11; no tooltip item.
- **Algorithms:** `js-array-sort` (premium) for C3's quick sort (S); `js-valid-parentheses` and `js-longest-substring-without-repeating` as easy-to-medium practice for the algorithm rounds (B2, B5, B6).
- **Behavioral:** the behavioral guide, for the motivation and departure questions (Q61 to Q63) and the English conversation of the fourth round.

### Skipped

- `String.includes`, `forEach`/`map`/`reduce` explanations (Q5): trivial or covered by `js-array-prototype-map` and `js-array-prototype-reduce` only loosely.
- The CMS take-home (Q54): no catalog item is a multi-language CMS; its UI half is a generic admin screen.
- Floating-point comparison (C5, removed as Q10): `js-bigint-data-type` is a trivia item about the type, not about comparison; not linked.

### Gaps (missing questions: reported, with no matching item)

1. **A socket-fed order book rendered without jank** (Q46; Q48 and B3's WebSocket topics): batching, throttled rendering, a bounded window, virtualization. `live-chart-high-frequency-updates` is a pinned design, not a coding item.
2. **A modal and a tooltip component** written live, with the mount and positioning decisions (Q11).
3. **File upload with drag-and-drop, a progress bar and a preview** as a coding item (Q12); `image-upload-preview` is a pinned design.
4. **Route, page and navigation permission management** in a React app, with a sidebar that differs by user (Q28).
5. **A K-line chart and a live-updating price table without libraries** as a take-home (Q48).
6. **List recycling** as a coding item (Q15); `infinite-scroll-list` covers the design.
7. **A compose function with unknown arguments** (Q6) if `js-compose` turns out to be the fixed-arity version.
8. **An English conversation check** (the fourth-round stage cell): not a catalog item, a page-copy fact that needs its own prep guidance.

## Proposed new questions to build (not approved; each needs the user's separate yes)

The catalog mapping above tags what exists. This section lists what the Binance evidence asks for and the catalog lacks, in build order. Priority: must (the page's signature or an answer guide depends on it), should (a reported task with no practice item), could (thin evidence or a small gain). Every coding item goes through the new-item harness before commit (JS tests in Node; React with jsdom and the runner's semantics), needs its decision graph and failure-explain rules when it carries solution code, and a `premiumPreview` when Premium. Budgets on 2026-11-18: `/coding` HTML 597,796 of 660,000 bytes (about 3 KB per row), total HTML 69.7 of 75 MB.

### Coding items

| # | Working title | Format, access | What it practises | Evidence | Why nothing covers it | Priority |
|---|---|---|---|---|---|---|
| N1 | Order book over a socket | React, premium, pressure-mode style: a fake feed pushes price-level updates in bursts; keep the book correct and the page responsive | batching updates per animation frame, a bounded window of levels, virtualised rows, parsing off the main thread; tests: top-of-book correct after a burst, no update dropped, a render-count bound | Q46 (B4, 2022); B3's WebSocket rounds (2021); Q48 (B9) | `live-chart-high-frequency-updates` is a pinned design, not a runnable task; no catalog item consumes a stream | must: the page's signature task and the Q46 answer guide's practice link |
| N2 | Modal and tooltip with a portal | React, premium | a modal mounted in `body` through a portal with focus and Escape handling; a tooltip positioned against its anchor, with the trade-offs of mounting in `body` versus the parent | Q11 (B1, 2020) | `html-dialog-confirm-a11y` is a native dialog in HTML; no tooltip or portal item | should |
| N3 | File upload with drag-and-drop, progress and preview | React, premium | a drop zone (`dragenter`, `dragover`, `drop`), a progress bar from upload progress events, an image preview through an object URL that is revoked | Q12 (B1, 2020) | `image-upload-preview` is a pinned design | should |
| N4 | Permission-aware routes and navigation | React, premium | a role map decides which routes render and which sidebar items show; an unauthorised route redirects; one wrapper component guards pages | Q28 (B1, 2020) | no item touches roles or guarded routes | should |
| N5 | Virtualised list with recycled rows | React, premium | render only the visible rows of a long list with a fixed row height, reuse row nodes, keep the scroll position; the follow-up to the API list | Q15, Q13 (B4, 2022) | `infinite-scroll-list` is a free design; `react-pagination-table` is pinned and paginates instead | should |
| N6 | K-line chart and live price table without libraries | React take-home style (like `react-battery-site-layout`), premium | candlesticks on a canvas from OHLC data; a price table that updates from a feed; no charting library | Q48 (B9, 2021, a comment); B3's WebSocket rounds | no chart item exists | could: large, and the evidence is one comment |
| N7 | Compose with asynchronous steps | JavaScript, premium or free | a compose whose steps may return promises, so the pipeline awaits each result; the rightmost step takes any arguments | Q6 (B1: "写一个compose函数，参数未知（arguments, promise)") | `js-compose` is synchronous | could |

### Trivia items (no catalog question asks these)

| # | Working title | What the answer covers | Evidence | Priority |
|---|---|---|---|---|
| T1 | React's render phase versus commit phase | what runs in each phase, why render work can be interrupted and commit cannot, where effects run | Q30 (B2, 2020); the fiber rows | should |
| T2 | React fiber: what it is and how it schedules work | the fiber tree, work units, priority lanes, why it exists | Q36 (B1, B4; C8, C10) | should: four sources |
| T3 | Micro-frontends: when they pay off and how teams split a UI | module boundaries, shared state and routing, versioning, the cost | B4's fourth round (the dropped Q43) | could |
| T4 | Why `localStorage.getItem` returns null | a missing key, a different origin, private mode, JSON that was never stringified | Q23 (B4) | could |

### Rehearsal and guide content (not catalog questions)

| # | Working title | Format | Source | Priority |
|---|---|---|---|---|
| R1 | The Binance question drill | a round decoder drill of about 20 short technical questions with self-checks, optionally timed | B4 rounds one and two; B6 (2024) | should |
| R2 | The English conversation | a decoder with the facts and a three-minute rehearsal (describe your biggest project in English) with checks | B4 round four; B3; G3; G4; G14 | should |
| R3 | Six answer guides | the practice-prompt format (statement, what this measures, clarify first, strong answer, common miss, a practice link) for Q46, Q24, Q41, Q19, Q31 and Q34 | the rows' sources | must (see Page package) |

### Order of work, if approved

N1 first (it unlocks the Q46 guide's practice link and the page's spotlight), then R3 and R1 (content only, no catalog change), then N2 to N5 one at a time with a review between them, as the Disney and Cloudflare questions were built. N6, N7 and the could-level trivia wait for a second source or a reader's request.

## Page package (decided with the user on 2026-11-18, after two blind buyer reads)

### What the two reads said

Three context-free readers (one Opus, two Sonnet; `research_notes/blind-read-scoring` recipe) read the unlocked list as a buyer who paid US$24 for a month because of a Binance interview in nine days. Scores as given, round one: disappointment 7, 6 and 6 of 10 (10 is worst); product quality 4, 5 and 4; worth the money: no, no, no; all three would consider the 14-day refund. Round two, after the Q10, Q23 and Q65 edits: 7, 6 and 6 again; quality 4, 5 and 4.5; the same refund verdicts. The reasons stayed structural: the open process table already names the topics, so the lock hid mostly generic question names; no answer outlines or exercises on the Binance-specific rows; no frequency labels; the newest full loop is 2022 and most rows come from one 2022 account; a card's answer line (BigInt) read as the guide's answer. Both reads saw the record's own row annotations and numbering gaps, which a page would not show; that inflates the disappointment a little but does not change the verdict. Outputs: `research_notes/company-candidates-2026-11-16/blind-binance-2026-11-18/` (round one `out-*.txt`, round two `r2-*.txt`). Their factual errors, kept apart from their scores: the CMS take-home (Q54) is attributed to Binance by the comment itself; the 2020 Juejin and Medium accounts are Binance sections of multi-company write-ups, so their attribution holds; the Medium post was published in 2021 about a 2020 loop; the skipped numbers and the empty section F are record conventions.

### How a v2 guide renders today (the Disney and Cloudflare pages)

- The question list shows every row's **topic** (one to six words) to everyone, with the round and kind chips and a Premium tag; the question's wording stays in the page as one blurred line. Clicking a locked row offers one free unlock per account or Premium. A member sees the reported wording, and, where the row has one, an **Answer guide** box (statement, what this measures, clarify first, strong-answer points, common miss, a practice link) and a **Practice** link to a runnable task. Behavioural rows are open by design. The free unlock applies only to rows that have a practice task or an answer guide.
- The process table is open; its practice links are blurred for guests. Round decoders (spotlight cards with facts) are open; a decoder can carry a drill (reported questions plus our own scenarios with self-checks). Study priorities, role lenses and the 7-day plan are Premium.
- The offer card promises that Premium opens every locked row with its practice task or answer guide where it has one.

### The lock rule for this page

Topics are already open, so opening the wording as well would leave nothing to buy (a reader would take the wording to an AI). The problem the readers found is the opposite: for about half of the rows the locked wording adds nothing to the open topic (`Throttle` unlocks to `Write a throttle`). Rule: **a row is locked only when its unlock gives something the topic does not: reported constraints or follow-ups, an answer guide, or a practice task.** Every other frontend row stays open as a reported topic. The offer card then counts the locked rows only, and the free-unlock rule (`no practice task or answer guide yet`) already matches.

### Lock decision per row

| Lock (20 rows) | What the unlock adds | Open as a topic (18 rows) |
|---|---|---|
| Q1 throttle and scroll debounce (Q2 merged) | practice `js-throttle`, `js-debounce` | Q5 warm-up pair |
| Q3 flatten without `flat` | the input and output, practice `js-flatten-once` | Q17 closures |
| Q4 dedupe without `Set` | the input and output, practice `js-unique-array` | Q18 delegation, event loop, capture and bubbling |
| Q6 compose with unknown arguments | practice `js-compose` | Q20 `typeof` and `instanceof` |
| Q7 deep copy | practice `js-deep-clone` | Q23 the `getItem` quirk |
| Q8 Promise and `Promise.all` by hand | practice `js-promise-all`, `js-create-deferred-promise` | Q27 pub-sub and singleton |
| Q11 modal and tooltip | the mount and positioning follow-ups | Q30 render versus commit |
| Q12 file upload | the drag-and-drop, progress and preview follow-ups; link `image-upload-preview` | Q32 HOC |
| Q13 API list component | the improvements follow-up, practice `react-fetch-list-states` | Q33 `connect` and context |
| Q15 list recycling | answer guide candidate, link `infinite-scroll-list` | Q36 fiber |
| Q19 event-loop snippet | the ordering snippet and the `setTimeout` 0 follow-up, answer guide | Q37 `useMemo` versus `useCallback` |
| Q24 token storage and safety | answer guide | Q38 React `key` |
| Q25 browser cache and status codes | the four status codes, answer guide with Q26 | Q39 Vue versus React |
| Q26 cache expiry chain and CDN | the five follow-ups, answer guide with Q25 | Q40 optimise a web app (covered by Q41's guide) |
| Q28 permission management | the sidebar example | Q42 SSR, CSR, bundlers |
| Q31 hooks rules and the conditional `useEffect` snippet | the snippet, answer guide | Q44 E2E and code review opinion |
| Q34 redux across three accounts | answer guide | Q49 a JS object for an unstated scenario |
| Q41 slow-page follow-up and triage | answer guide | Q54 the CMS take-home (a brief, not a question) |
| Q46 order book over a socket | answer guide, the new exercise | |
| Q48 K-line and live price table | the no-libraries constraint | |

Plus the 8 behavioural rows (Q55 to Q63), open by design. 46 rows in all after merging Q2 into Q1.

### The eight page items: today and after

1. **Answer guides (6).** Today: none for Binance; on the Cloudflare page a member sees `Answer guide: Countdown timer in thirty minutes` with its outline under the row. After: the same box under Q46 (clarify first: update rate, visible depth; strong answer: batch socket messages, render once per animation frame, keep a bounded window of price levels, virtualise rows, parse off the main thread; common miss: rendering per message), Q24 (where a token lives and what each place exposes), Q41 (reproduce, measure, tell a slow network from a slow page, then the optimisations), Q19 (the microtask and macrotask order, why `setTimeout` 0 is not 0), Q31 (why hooks must run in the same order; what the early return breaks), Q34 (redux's data flow and when it is worth it). Each guide cites the reported follow-ups, not generic prose (the no-templates rule).
2. **The order-book exercise.** Today: Q46 has no practice link because no catalog item exists. After: a premium React task in the pressure-mode format (a socket-like feed of price levels; the candidate must keep the UI responsive and the book correct), linked from Q46 as `Practice: Order book over a socket`. It is a new catalog question and needs the user's separate yes. Gap 1 in the catalog proposal.
3. **The question drill.** Today: drills exist for behavioural rounds (Cloudflare's Orange Cloud). After: a round decoder `The question drill` with about 20 short technical questions from B4's first two rounds and B6's 2024 drill, each with a self-check (`you can state the render and commit split in two sentences`), optionally timed. Open or Premium is the user's decision; behavioural drills are open.
4. **Frequency chips.** Today: rows show round and kind chips; only the process table shows evidence counts. After: a third chip per row from its `sources` (`3 accounts · 2020–22`, `1 card · 2022`). A small change to the shared question-list component, so every guide gets it.
5. **The English conversation spotlight.** Today: nothing. After: a round decoder with the facts (B4's fourth-round "英文還可以嗎? 我們來對話看看", B3's partly-English third round, the all-English phone review of a 2025 Java loop, the 2025 referral post on the working language) and a drill item: describe your biggest project in English in three minutes, with checks.
6. **Honesty before the paywall.** Today: a short hero caveat and a `Sources and evidence limits` section at the end. After: the caveat also says that most locked rows come from one four-round account of 2022 and that three 2020-2021 accounts and a 2024 card corroborate it, and that the interviewers are mostly Mandarin speakers.
7. **Copy hygiene.** Today: the record's rows carry merged-from notes, topic markers and first-line-of-a-card notes. After: the page's `topic` is one to six words, `question` is in our words with no record notes, merged rows are one question each, and the offer card counts locked questions.
8. **Freshness.** Today: the newest full loop is 2022-05. After: the hero says so; the page leans on the 2026 postings (AI tooling required, React and Vue, the AI facial-recognition product) and the 2024 drill for recency; the locked interview.tw cards and the 2026 Blind question post are the leads for a later update.

### Open decisions

- The order-book exercise (a new catalog question).
- Whether the question drill is open or Premium.
- The frequency chip touches the shared component used by all 32 guides.
- The third blind read happens on the built page, not on the record, and gates the build decision.

## Verification

- `research_notes/check_binance_quotes_2026-11-18.mjs` checks every double-quoted phrase in this file against the saved pages under `research_notes/company-candidates-2026-11-16/raw/binance/`. Run: `node research_notes/check_binance_quotes_2026-11-18.mjs`. The result at the time of writing is recorded in the Status section.
- Not verifiable by our tools: the locked bodies of the interview.tw cards; the CSDN, Zhihu and Medium (Huli) posts; the LeetCode post; Glassdoor.

## Status (2026-11-18)

- Record written from the 2026-11-16 source round and the 2026-11-18 re-reads; no page, catalog tag, router entry or plan entry has been made.
- Quote check (2026-11-18): 199 of 199 distinct quoted phrases found in the saved pages (`node research_notes/check_binance_quotes_2026-11-18.mjs`).
- 2026-11-18, later: the question list was trimmed after the user's premium-buyer review (65 numbered rows, 49 listed: 12 removed, 4 merged, 1 trimmed; see Count). Quote check re-run after the edit: 199 of 199 found; no reference to a removed or merged row remains outside the Count section.
- 2026-11-18, blind buyer reads: two rounds of three context-free readers scored the unlocked list 4 to 5 of 10 and judged it not worth US$24; Q10 and Q65 were removed, Q23 was glossed, Q2 was merged into Q1 (46 listed), and the Page package section records the lock rule (20 locked rows, 18 open topics), the eight page items with their today-and-after rendering, and the open decisions. The two Blind question posts were renamed QP1 and QP2 so they no longer share ids with list rows. Quote check after these edits: 199 of 199 distinct quoted phrases found.
- 2026-11-18, later: a section Proposed new questions to build lists seven coding items (N1 the order book first), four trivia items and three content pieces, each needing the user's separate yes; quote check unchanged.
- 2026-11-18, later: an implementation plan for those questions is in `reports/binance-sorular-plani-2026-11-18.md` (git-excluded): first wave N1 to N5, T1, T2 and R1 to R3; second wave N6, N7, T3, T4; questions built untagged until the Binance page skeleton exists, because a `companies` tag alone creates a catalog company page. Nothing is approved or built.
- 2026-11-20: the first-wave questions are built and in PR #271 (into dev): N1 `react-order-book-socket-feed`, N2 `react-modal-tooltip-portal`, N3 `react-file-upload-dropzone-progress`, N4 `react-role-aware-routes`, N5 `react-virtualized-list-recycling`, T1 `react-render-vs-commit-phase`, T2 `react-fiber-scheduling`. T2 replaces `react-concurrent-rendering` as Q36's trivia. N6, N7, T3 and T4 are not built.
- 2026-11-20, page build (branch `feat/company-guide-binance`, plan in `reports/binance-sayfa-plani-2026-11-20.md`): the catalog mapping is applied (29 items tagged), the process tables and the question list are in `company-interview-processes.ts` with the lock rule (20 locked, 18 open, 8 behavioural), and the plan rounds and profile are in place. A shared `open` flag on question rows carries the open topics.
- 2026-11-20, corrections from re-reading B4's saved card: its fourth round happened because the team that took candidates first turned the candidate down in round three ("通過二面的會優先到該 team 面試，而我被刷掉，故才有第四面"), not because a team takes first pick of those who pass; the question on the technology at the candidate's company ("介紹我待的公司在用的技術") is round two's first item, so the E2E question joins it in the behavioural group (Q58) and Q44 keeps the code-review opinion only. Quote check after these edits: 201 of 201 distinct quoted phrases found.
- 2026-11-21, step 4 fact-check of the page: B2's rounds were phone rounds ("3輪Tech phone interview"), not video; B8's replier gives no place (the opening poster, a backend applicant, is the one in Europe); "內推的部門主管" is the head of the department the candidate was referred to, not the referrer; "三大排序策略" is ordering, not scheduling; the O2 saves and G4 never name the Accelerator Program (G4's title is BAP-GOLANG ENGINEER); B1 names no place and is dated only by its post. On the page, Q1 and Q2 are separate rows again (throttle, B4; scroll debounce, C2, open), Q8 splits into Promise.all by hand (C4, locked) and a Promise implementation exercise (C1, open), C8 left Q36, B6 left Q42 and B2 left Q40; 40 rows, 20 locked, 20 open.
