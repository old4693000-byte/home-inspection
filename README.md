# 家驗｜裝潢驗收系統

這是一個用照片、位置與文字記錄裝潢問題，讓屋主與設計師共同追蹤修復及驗收的繁體中文開源網站。支援平面圖標記、設計師進度更新，以及保留歷史的逐輪驗收。

**本儲存庫只含程式與虛構範例。沒有真實住宅圖面、照片、驗收紀錄、私人電子郵件、既有住宅網站連結、雲端專案 ID 或金鑰。** 正式資料庫預設為空白，使用者自行上傳自己的平面圖並建立自己的儲存空間。

採用 [MIT 授權](LICENSE)。取得原始碼可按 GitHub 的 **Code → Download ZIP**，或執行：

```bash
git clone https://github.com/old4693000-byte/home-inspection.git
cd home-inspection
npm ci
npm run db:local
npm run dev
```

需 Node.js 24。打開終端機顯示的本機網址即可開始；首次啟動的正式清單是空白，可按「操作示範（範例）」練習。完整部署方式見下文。

## 1. 先了解部署方式

- **GitHub**：存放原始碼及版本紀錄。
- **Cloudflare Workers**：執行網站與 API。
- **Cloudflare D1**：保存問題、處理進度、驗收結果與輪次紀錄。
- **Cloudflare R2**：保存平面圖與照片。

這個版本包含後端與共用資料庫，不能只把原始碼丟到 GitHub Pages 就完成多人共用。依第 6 節部署到自己的 Cloudflare 帳號。單純推送 GitHub 不會自動部署；本專案沒有設定自動發布。

本機可使用 D1 / R2 模擬儲存，不需先登入 Cloudflare。遠端部署需要接收者自己的帳號與已啟用的相關服務。服務額度與收費依帳號方案確認，本文件不承諾免費。

## 2. 已具備的功能

| 功能 | 行為 |
| --- | --- |
| 共用入口 | 進站後自行選擇「屋主」「設計師」「參觀」 |
| 屋主新增問題 | 選空間、填詳細位置與敘述、附問題照片 |
| 空間選擇 | 下拉選單含常見空間，並有「其他（自行填寫）」 |
| 平面圖 | 屋主上傳自己的圖片，點選位置，支援縮放及多張圖面 |
| 位置標記 | 同一位置有多筆問題時可先查看該位置的問題群組 |
| 設計師更新進度 | 可寫「已排工，預計下週處理」，每次保留時間與訊息 |
| 設計師完成修復 | 另有完成操作，可附修復說明與照片，再進入待驗收 |
| 屋主直接驗收 | 即使設計師還沒勾完成，也能通過或不通過 |
| 不通過再處理 | 本輪結案，保留原因及舊紀錄，建立下一輪待修復項目 |
| 防止誤按 | 驗收通過前先顯示確認視窗 |
| 撤銷驗收 | 通過可撤銷；不通過僅能在下一輪尚未開始處理時撤銷，保留更正紀錄 |
| 刪除與恢復 | 屋主確認後移到回收筒，可恢復原問題、照片、輪次與狀態 |
| 歷史紀錄 | 顯示各輪的問題、照片、進度、修復回報、驗收結果 |
| 清單與篩選 | 切換清單／地圖，依狀態與空間篩選 |
| 返回操作 | 詳情有明確返回按鈕；恢復原本篩選、位置及捲動狀態 |
| 參觀模式 | 同步查看正式資料，這個模式下不可修改 |
| 操作示範 | 使用虛構平面圖、問題及日期，不寫入正式資料 |

介面為繁體中文，可用手機與電腦瀏覽。圖片支援 JPG、PNG、WebP，單張上限 20 MB，每次問題／修復照片最多 8 張。PDF 圖說請先將需要的頁面轉成圖片；本版沒有內建 PDF 轉圖。

### 角色與存取方式

本版延續「打開連結就能使用」的方式，**角色選擇不是身分驗證**。任何取得網站網址的人都可以選屋主或設計師；參觀模式雖限制修改，但使用者可以回首頁換角色。每個部署是一份共用清單，尚未具備帳號登入、住戶隔離或多專案權限。

若接收者需要只有指定人士能編輯，應另加登入與伺服器端權限驗證，不能只隱藏按鈕。公開 GitHub 原始碼也不代表必須公開日後的住宅資料。

## 3. 修復與驗收規則

| 當前狀態 | 操作 | 結果 |
| --- | --- | --- |
| 待修復 | 設計師更新進度 | 狀態不變，新增一筆有時間的訊息 |
| 待修復 | 設計師完成修復 | 變成待驗收，保存修復回報 |
| 待驗收 | 設計師補充進度 | 仍是待驗收，不覆寫原修復回報 |
| 待修復或待驗收 | 屋主驗收通過 | 變成已通過，沒有填說明時記為 OK |
| 待修復或待驗收 | 屋主驗收不通過 | 必填原因；關閉本輪並新增下一輪，變回待修復 |
| 已通過 | 再次修復／驗收／更新進度 | 拒絕重複操作，可由屋主先撤銷驗收 |
| 已通過 | 屋主撤銷驗收 | 有修復回報則回待驗收，否則回待修復；保留更正紀錄 |
| 不通過後的下一輪尚未開始處理 | 屋主撤銷驗收 | 撤回空白下一輪並保存內容，恢復前一輪驗收前狀態 |
| 任一未刪除狀態 | 屋主刪除問題 | 移至回收筒；保留原狀態、照片及所有輪次 |
| 回收筒 | 屋主恢復問題 | 恢復原狀態，重新出現在各角色的清單 |

「不通過」沿用同一個問題編號，在該問題內增加下一輪處理，保留原位置及歷史，不會覆寫舊輪次或產生毫無關聯的問題。

## 4. 本機開始使用

準備 Node.js 24 與 npm；要推上 GitHub 另需 Git。解壓縮後，進入有 `package.json` 的 `home-inspection` 資料夾。

```bash
npm ci
npm run db:local
npm run dev
```

依終端機顯示的網址開啟網站，預設為 `http://127.0.0.1:5173`。如果該埠已被占用，Vite 可能改用下一個埠。

第一次進站，先選「屋主」。正式清單是空白；可點「操作示範（範例）」練習，或直接上傳自己的平面圖後新增問題。上傳圖片是儲存資料，不是把檔案放進 GitHub 的 `public/`。

本機資料存放於 `.wrangler/state/`，與雲端資料分開。這個目錄已加入 `.gitignore`，不可放進分享壓縮檔。若更換 `database_id` 或本機儲存路徑，需再次初始化對應的本機資料庫。

### 檢查與建置

```bash
npm test
npm run typecheck
npm run build
```

交付前已在 Node.js 24 環境完成乾淨安裝、空白本機資料庫初始化、18 項流程測試、型別檢查、正式建置，以及 7 組基礎 API 與 5 組撤銷／回收 API 整合檢查。雲端部署需由接收者使用自己的帳號執行，尚未代接收者上線。

另有會寫入**虛構測試資料**的整合測試。保持本機開發伺服器運行，再開另一個終端機執行：

```bash
npm run test:integration
```

測試預設連線 `http://127.0.0.1:5173`，只允許 loopback HTTP，不可拿正式網站測試。若本機使用其他埠，設定 `INSPECTION_TEST_URL` 再執行。PowerShell 範例：

```powershell
$env:INSPECTION_TEST_URL = 'http://127.0.0.1:5180'
npm run test:integration
```

整合測試會留下測試問題和一像素合成圖片，方便回讀檢查；正式啟用時使用空白的遠端資料庫，不要搬移本機測試資料。

## 5. 推上自己的 GitHub

最直接的方式是在 GitHub 按 **Fork** 建立自己的副本，再 clone 自己的 repository。若是下載 ZIP 後另建專案，可先在自己的 GitHub 建立一個空白 repository；若要照以下指令第一次推送，建立時不要自動加 README。可自行決定公開或私人。

在解壓縮後的專案根目錄執行：

```bash
git init
git branch -M main
git add .
git status --short
```

確認待提交內容只有程式、文件、虛構範例與設定模板，沒有 `.env`、`.dev.vars`、`.wrangler/`、上傳照片或本機備份。再執行：

```bash
git commit -m "Initial home inspection app"
git remote add origin YOUR_GITHUB_REPOSITORY_URL
git push -u origin main
```

把 `YOUR_GITHUB_REPOSITORY_URL` 替換成自己的 repository URL。這組 `git init` 指令適用於 Download ZIP 解壓後建立新 repository；Fork 或 clone 的副本已經有 Git 設定，無須再執行。新提交作者使用自己的本機 Git 設定。

## 6. 部署成大家都能打開的網站

以下命令由接收者在自己的電腦及 Cloudflare 帳號執行。請先完成本機確認，再建立**自己的** D1 與 R2 資源：

```bash
npx wrangler login
npx wrangler d1 create home-inspection-db
npx wrangler r2 bucket create home-inspection-files
```

將 `wrangler.jsonc` 的 `database_id` 換成 `d1 create` 回傳的實際 ID。檔案內目前的全零型 UUID 只是本機佔位值。若用了其他資料庫或 bucket 名稱，同步修改 `database_name` 及 `bucket_name`；程式綁定名稱維持 `DB` 與 `BUCKET`。

`name` 是 Worker 名稱，可改成自己的專案名稱。若帳號有多個 Cloudflare account，可在設定中填自己的 `account_id`，或於執行環境設定 `CLOUDFLARE_ACCOUNT_ID`。API token 不可寫入原始碼。

建立遠端資料表並部署：

```bash
npm run db:remote
npm run deploy
```

`db:remote` 會修改已設定的遠端資料庫；執行前確認是新建的獨立資料庫。`deploy` 先建置，再由 Cloudflare Vite plugin 產生的設定發布 Worker。取得終端機回傳的新網站網址後，依下面清單驗收。

R2 bucket 不需要開公開存取，網站透過 Worker 的圖片 API 讀取圖片。圖面與照片放在儲存服務內，不會因 `git push` 被自動上傳。

這條部署流程使用 Cloudflare 的 [Vite plugin](https://developers.cloudflare.com/workers/vite-plugin/get-started/)、[D1 migrations](https://developers.cloudflare.com/d1/wrangler-commands/) 及 [R2 bucket 建立命令](https://developers.cloudflare.com/r2/buckets/create-buckets/)。首次部署後仍需以接收者自己的帳號與網址驗證。

### 上線驗收清單

- [ ] 新網址可以選擇三種角色，各角色看到同一份清單。
- [ ] 屋主可以上傳自己的平面圖、新增照片及位置標記。
- [ ] 設計師可以更新排工訊息，而不會自動變成待驗收。
- [ ] 設計師完成修復後，屋主能看到修復說明。
- [ ] 設計師尚未完成時，屋主仍能直接通過或不通過。
- [ ] 不通過會保留舊輪次，新增下一輪，位置不會遺失。
- [ ] 返回詳情上一層時，仍保留篩選與捲動位置。
- [ ] 用另一個瀏覽器開相同網址，重新整理後能讀到共用資料。
- [ ] 範例模式清楚標示虛構，沒有混入正式清單。
- [ ] 驗收通過前需確認；誤按後可撤銷，原照片與修復紀錄仍在。
- [ ] 刪除的問題只顯示於屋主回收筒，恢復後各角色重新看得到。

## 7. 程式結構與資料模型

```text
app/
  page.tsx                   三種角色的共用入口
  owner/ designer/ visitor/  各角色頁面
  inspection-app.tsx         清單、詳情、修復與驗收操作
  components.tsx             平面圖、照片與新增問題表單
  issue-management.tsx       撤銷、回收筒與更正紀錄
  use-inspection-navigation.ts  返回、篩選及捲動狀態
  api/                       session、state、issues、upload、assets、share
lib/
  model.ts                   型別、狀態及全虛構示範資料
  workflow.ts                進度、修復、通過、不通過的規則
  server.ts                  儲存綁定、請求驗證與資料轉換
db/schema.ts                 D1 資料表定義
drizzle/                     空資料表的 SQL migrations
public/demo-plan.svg         新繪製的虛構示意圖
tests/                       流程測試及本機 API 整合測試
worker.ts                    Worker 入口
vite.config.ts               vinext 與 Cloudflare Vite plugin
wrangler.jsonc               接收者自己的儲存及部署設定
```

技術組合為 TypeScript、React、Next.js 相容的 App Router、vinext / Vite、Tailwind CSS、Cloudflare Workers / D1 / R2。相依版本以 `package-lock.json` 固定；使用 `npm ci` 還原已驗證的組合。vinext 此交付版本仍為 beta，升級框架前請重新執行測試。

資料表分為 `issues`、`plans`、`assets`。問題包含空間、詳細位置、描述、圖面 ID、座標、狀態、輪次及 revision。issues.deleted_at 記錄是否在回收筒，issues.changes 保存撤銷、刪除及恢復紀錄。每輪保存描述、照片、進度訊息、修復回報及驗收結果；輪次以 JSON 存在 `issues.rounds`。

前端座標是 0 到 1 的相對位置，資料庫以整數縮放保存，避免跟螢幕尺寸綁死。建立問題使用 request ID 避免重複送出；更新使用 revision 避免同時寫入時蓋掉別人的紀錄。

## 8. 去識別化範圍

- 用全新的虛構示意圖取代任何住宅圖面；圖上沒有尺寸、門牌、建案、樓層或戶別。
- 範例問題及進度為重新編寫的測試文字；2030 年日期也是虛構日期。
- 不含真實照片、PDF、截圖、相片 metadata、資料庫匯出、上傳檔案或操作紀錄。
- 不含既有住宅網站網址、專案識別碼、存取金鑰、帳號設定或本機私人路徑。公開 repository 的作者代號與 GitHub 網址屬於開源專案資訊。
- 不帶入私人開發專案的 `.git` 與提交紀錄。此開源專案使用全新歷史，排除 `.openai/`、`.env`、`.dev.vars`、`.wrangler/`、建置產物及執行 log。
- 正式資料不以範例 seed 匯入；資料表初始化後是空白。

這裡的去識別化是針對**交付包**。系統不會自動匿名化日後上傳的照片與文字；接收者新增的真實資料應留在自己的資料庫與檔案儲存，別放到公開 repository。

## 9. 可以直接交給 AI 開發工具的指令

> 請閱讀這份 README，使用隨附的原始碼建立我自己的「裝潢驗收系統」。保留繁體中文、屋主／設計師／參觀選角、圖片與平面圖標記、處理進度、修復回報、屋主直接驗收、不通過保留舊輪次並新增下一輪，以及返回原清單狀態等功能。
>
> 先確認原始碼結構並在本機啟動，執行流程測試、型別檢查與建置。若只有這份 Markdown 而沒有 ZIP，依本文件第 2、3、7 節重建功能，且先提供虛構資料示範；不要宣稱已取得原始碼。
>
> 使用我自己的 GitHub repository、Cloudflare Workers、D1 與 R2。不得使用任何原使用者的連結、帳號、圖面、照片、資料或識別碼。正式資料庫從空白開始，範例只用明確標示的虛構資料。保留 .gitignore，勿把本機資料、token 或密碼推上 GitHub。
>
> 說明此版角色是自由選擇，尚無真正登入與專案隔離。若我要求限制存取，請完整實作伺服器端權限，而不只是隱藏介面。推送 repository 或發布網站前，先完成可檢查的本機版本，再依我明確指定的帳號與授權操作。

## 10. 後續可自行擴充

登入與邀請制、多個住宅專案、期限與提醒、CSV / PDF 報表、資料備份及批次匯出均可再開發，**不是這個版本已完成的功能**。目前預計處理時間以進度文字記錄，沒有獨立排程欄位或提醒服務。

## 11. 授權與第三方套件

專案程式與虛構範例採 [MIT License](LICENSE)，允許使用、修改、散布與商用；散布時須保留授權及著作權聲明。套件相依項各自依其原有授權使用，本專案的 MIT 授權不會替換第三方套件的授權。原始碼 repository 不包含 `node_modules` 或第三方建置產物。
