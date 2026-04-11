export interface KarutaCard {
  id: number;
  shimoNoKu: string;
  kamiNoKu: string;
  yomi: string;
}

export const ALL_CARDS: KarutaCard[] = [
  { id: 1, shimoNoKu: "朝ぼらけ 宇治の川霧 たえだえに", kamiNoKu: "秋の田の かりほの庵の 苫をあらみ", yomi: "あきのたの" },
  { id: 2, shimoNoKu: "春過ぎて 夏来にけらし 白妙の", kamiNoKu: "衣ほすてふ 天の香具山", yomi: "はるすぎて" },
  { id: 3, shimoNoKu: "足引きの 山鳥の尾の しだり尾の", kamiNoKu: "長々し夜を ひとりかも寝む", yomi: "あしびきの" },
  { id: 4, shimoNoKu: "田子の浦に うちいでて見れば 白妙の", kamiNoKu: "富士の高嶺に 雪はふりつつ", yomi: "たごのうらに" },
  { id: 5, shimoNoKu: "奥山に もみぢ踏みわけ 鳴く鹿の", kamiNoKu: "声きく時ぞ 秋はかなしき", yomi: "おくやまに" },
  { id: 6, shimoNoKu: "鵲の わたせる橋に おく霜の", kamiNoKu: "白きを見れば 夜ぞ更けにける", yomi: "かささぎの" },
  { id: 7, shimoNoKu: "天の原 ふりさけみれば 春日なる", kamiNoKu: "三笠の山に いでし月かも", yomi: "あまのはら" },
  { id: 8, shimoNoKu: "わが庵は 都のたつみ しかぞすむ", kamiNoKu: "世をうぢ山と 人はいふなり", yomi: "わがいおは" },
  { id: 9, shimoNoKu: "花の色は うつりにけりな いたづらに", kamiNoKu: "わが身世にふる ながめせしまに", yomi: "はなのいろは" },
  { id: 10, shimoNoKu: "これやこの 行くも帰るも 別れては", kamiNoKu: "知るも知らぬも 逢坂の関", yomi: "これやこの" },
  { id: 11, shimoNoKu: "わたの原 八十島かけて こぎいでぬと", kamiNoKu: "人には告げよ 海人の釣舟", yomi: "わたのはら" },
  { id: 12, shimoNoKu: "天つ風 雲の通ひ路 吹きとぢよ", kamiNoKu: "乙女の姿 しばしとどめむ", yomi: "あまつかぜ" },
  { id: 13, shimoNoKu: "筑波嶺の 峰より落つる みなの川", kamiNoKu: "恋ぞつもりて 淵となりぬる", yomi: "つくばねの" },
  { id: 14, shimoNoKu: "陸奥の しのぶもぢずり 誰ゆゑに", kamiNoKu: "みだれそめにし 我ならなくに", yomi: "みちのくの" },
  { id: 15, shimoNoKu: "君がため 春の野にいでて 若菜摘む", kamiNoKu: "わが衣手に 雪はふりつつ", yomi: "きみがため" },
  { id: 16, shimoNoKu: "たち別れ いなばの山の 峰におふる", kamiNoKu: "まつとし聞かば 今かへり来む", yomi: "たちわかれ" },
  { id: 17, shimoNoKu: "ちはやぶる 神代もきかず 竜田川", kamiNoKu: "からくれなゐに 水くくるとは", yomi: "ちはやぶる" },
  { id: 18, shimoNoKu: "住の江の 岸による浪 よるさへや", kamiNoKu: "夢のかよひ路 人目よくらむ", yomi: "すみのえの" },
  { id: 19, shimoNoKu: "難波潟 みじかき葦の ふしの間も", kamiNoKu: "逢はでこの世を 過ぐしてよとや", yomi: "なにわがた" },
  { id: 20, shimoNoKu: "わびぬれば 今はた同じ 難波なる", kamiNoKu: "みをつくしても 逢はむとぞ思ふ", yomi: "わびぬれば" },
  { id: 21, shimoNoKu: "今来むと いひしばかりに 長月の", kamiNoKu: "ありあけの月を 待ちいでつるかな", yomi: "いまこんと" },
  { id: 22, shimoNoKu: "吹くからに 秋の草木の しをるれば", kamiNoKu: "むべ山風を 嵐といふらむ", yomi: "ふくからに" },
  { id: 23, shimoNoKu: "月みれば ちぢにものこそ 悲しけれ", kamiNoKu: "わが身ひとつの 秋にはあらねど", yomi: "つきみれば" },
  { id: 24, shimoNoKu: "このたびは ぬさもとりあへず 手向山", kamiNoKu: "紅葉の錦 神のまにまに", yomi: "このたびは" },
  { id: 25, shimoNoKu: "名にしおはば 逢坂山の さねかづら", kamiNoKu: "人に知られで くるよしもがな", yomi: "なにしおわば" },
  { id: 26, shimoNoKu: "小倉山 峰のもみぢ葉 心あらば", kamiNoKu: "今ひとたびの みゆき待たなむ", yomi: "おぐらやま" },
  { id: 27, shimoNoKu: "みかの原 わきて流るる いづみ川", kamiNoKu: "いつ見きとてか 恋しかるらむ", yomi: "みかのはら" },
  { id: 28, shimoNoKu: "山里は 冬ぞさびしさ まさりける", kamiNoKu: "人目も草も かれぬと思へば", yomi: "やまざとは" },
  { id: 29, shimoNoKu: "こころあてに 折らばや折らむ 初霜の", kamiNoKu: "おきまどはせる 白菊の花", yomi: "こころあてに" },
  { id: 30, shimoNoKu: "有明の つれなく見えし 別れより", kamiNoKu: "暁ばかり うきものはなし", yomi: "ありあけの" },
  { id: 31, shimoNoKu: "朝ぼらけ 有明の月と 見るまでに", kamiNoKu: "吉野の里に ふれる白雪", yomi: "あさぼらけ" },
  { id: 32, shimoNoKu: "山川に 風のかけたる しがらみは", kamiNoKu: "流れもあへぬ 紅葉なりけり", yomi: "やまがわに" },
  { id: 33, shimoNoKu: "久方の 光のどけき 春の日に", kamiNoKu: "しづごころなく 花の散るらむ", yomi: "ひさかたの" },
  { id: 34, shimoNoKu: "誰をかも 知る人にせむ 高砂の", kamiNoKu: "松も昔の 友ならなくに", yomi: "たれをかも" },
  { id: 35, shimoNoKu: "人はいさ 心も知らず ふるさとは", kamiNoKu: "花ぞ昔の 香ににほひける", yomi: "ひとはいさ" },
  { id: 36, shimoNoKu: "夏の夜は まだ宵ながら 明けぬるを", kamiNoKu: "雲のいづこに 月やどるらむ", yomi: "なつのよは" },
  { id: 37, shimoNoKu: "白露に 風の吹きしく 秋の野は", kamiNoKu: "つらぬきとめぬ 玉ぞ散りける", yomi: "しらつゆに" },
  { id: 38, shimoNoKu: "忘らるる 身をば思はず 誓ひてし", kamiNoKu: "人の命の 惜しくもあるかな", yomi: "わすらるる" },
  { id: 39, shimoNoKu: "浅茅生の 小野の篠原 しのぶれど", kamiNoKu: "あまりてなどか 人の恋しき", yomi: "あさじおの" },
  { id: 40, shimoNoKu: "しのぶれど いろに出でにけり わが恋は", kamiNoKu: "ものや思ふと 人の問ふまで", yomi: "しのぶれど" },
  { id: 41, shimoNoKu: "恋すてふ わが名はまだき 立ちにけり", kamiNoKu: "人知れずこそ 思ひそめしか", yomi: "こいすちょう" },
  { id: 42, shimoNoKu: "契りきな かたみに袖を しぼりつつ", kamiNoKu: "末の松山 波越さじとは", yomi: "ちぎりきな" },
  { id: 43, shimoNoKu: "逢ひ見ての のちの心に くらぶれば", kamiNoKu: "昔はものを 思はざりけり", yomi: "あいみての" },
  { id: 44, shimoNoKu: "逢ふことの 絶えてしなくば なかなかに", kamiNoKu: "人をも身をも 恨みざらまし", yomi: "おうことの" },
  { id: 45, shimoNoKu: "あはれとも いふべき人は 思ほえで", kamiNoKu: "身のいたづらに なりぬべきかな", yomi: "あわれとも" },
  { id: 46, shimoNoKu: "由良の門を わたる舟人 かぢをたえ", kamiNoKu: "ゆくへも知らぬ 恋の道かな", yomi: "ゆらのとを" },
  { id: 47, shimoNoKu: "八重むぐら しげれる宿の さびしきに", kamiNoKu: "人こそ見えね 秋は来にけり", yomi: "やえむぐら" },
  { id: 48, shimoNoKu: "風をいたみ 岩うつ浪の おのれのみ", kamiNoKu: "くだけてものを 思ふころかな", yomi: "かぜをいたみ" },
  { id: 49, shimoNoKu: "みかきもり 衛士の焚く火の 夜は燃え", kamiNoKu: "昼は消えつつ ものをこそ思へ", yomi: "みかきもり" },
  { id: 50, shimoNoKu: "君がため 惜しからざりし 命さへ", kamiNoKu: "長くもがなと 思ひけるかな", yomi: "きみがため" },
  { id: 51, shimoNoKu: "かくとだに えやは伊吹の さしも草", kamiNoKu: "さしも知らじな もゆる思ひを", yomi: "かくとだに" },
  { id: 52, shimoNoKu: "明けぬれば 暮るるものとは 知りながら", kamiNoKu: "なほ恨めしき 朝ぼらけかな", yomi: "あけぬれば" },
  { id: 53, shimoNoKu: "嘆きつつ ひとりぬる夜の 明くる間は", kamiNoKu: "いかに久しき ものとかは知る", yomi: "なげきつつ" },
  { id: 54, shimoNoKu: "忘れじの 行く末までは かたければ", kamiNoKu: "今日を限りの 命ともがな", yomi: "わすれじの" },
  { id: 55, shimoNoKu: "滝の音は 絶えて久しく なりぬれど", kamiNoKu: "名こそ流れて なほ聞えけれ", yomi: "たきのおとは" },
  { id: 56, shimoNoKu: "あらざらむ この世のほかの 思ひ出に", kamiNoKu: "今ひとたびの 逢ふこともがな", yomi: "あらざらん" },
  { id: 57, shimoNoKu: "めぐりあひて 見しやそれとも わかぬ間に", kamiNoKu: "雲がくれにし 夜半の月かな", yomi: "めぐりあいて" },
  { id: 58, shimoNoKu: "有馬山 猪名の笹原 風吹けば", kamiNoKu: "いでそよ人を 忘れやはする", yomi: "ありまやま" },
  { id: 59, shimoNoKu: "やすらはで 寝なましものを 小夜更けて", kamiNoKu: "かたぶく月の 頃ぞあやしき", yomi: "やすらわで" },
  { id: 60, shimoNoKu: "大江山 いく野の道の 遠ければ", kamiNoKu: "まだふみもみず 天の橋立", yomi: "おおえやま" },
  { id: 61, shimoNoKu: "いにしへの 奈良の都の 八重桜", kamiNoKu: "けふ九重に にほひぬるかな", yomi: "いにしえの" },
  { id: 62, shimoNoKu: "夜をこめて 鳥の空音は はかるとも", kamiNoKu: "よに逢坂の 関は許さじ", yomi: "よをこめて" },
  { id: 63, shimoNoKu: "今はただ 思ひ絶えなむ とばかりを", kamiNoKu: "人づてならで いふよしもがな", yomi: "いまはただ" },
  { id: 64, shimoNoKu: "朝ぼらけ 宇治の川霧 たえだえに", kamiNoKu: "あらはれわたる 瀬々の網代木", yomi: "あさぼらけうじ" },
  { id: 65, shimoNoKu: "恨みわび ほさぬ袖だに あるものを", kamiNoKu: "恋に朽ちなむ 名こそをしけれ", yomi: "うらみわび" },
  { id: 66, shimoNoKu: "もろともに あはれと思へ 山桜", kamiNoKu: "花よりほかに 知る人もなし", yomi: "もろともに" },
  { id: 67, shimoNoKu: "春の夜の 夢ばかりなる 手枕に", kamiNoKu: "かひなく立たむ 名こそをしけれ", yomi: "はるのよの" },
  { id: 68, shimoNoKu: "こころにも あらでうき世に ながらへば", kamiNoKu: "恋しかるべき 夜半の月かな", yomi: "こころにも" },
  { id: 69, shimoNoKu: "嵐吹く 三室の山の もみぢ葉は", kamiNoKu: "竜田の川の 錦なりけり", yomi: "あらしふく" },
  { id: 70, shimoNoKu: "寂しさに 宿を立ち出でて ながむれば", kamiNoKu: "いづくも同じ 秋の夕暮れ", yomi: "さびしさに" },
  { id: 71, shimoNoKu: "夕されば 門田の稲葉 おとづれて", kamiNoKu: "芦のまろ屋に 秋風ぞ吹く", yomi: "ゆうされば" },
  { id: 72, shimoNoKu: "音に聞く 高師の浜の あだ波は", kamiNoKu: "かけじや袖の 濡れもこそすれ", yomi: "おとにきく" },
  { id: 73, shimoNoKu: "高砂の おのへの松も 齢経て", kamiNoKu: "神代の昔に 立てりとぞ聞く", yomi: "たかさごの" },
  { id: 74, shimoNoKu: "憂かりける 人を初瀬の 山おろしよ", kamiNoKu: "はげしかれとは 祈らぬものを", yomi: "うかりける" },
  { id: 75, shimoNoKu: "契りおきし させもが露を 命にて", kamiNoKu: "あはれ今年の 秋もいぬめり", yomi: "ちぎりおきし" },
  { id: 76, shimoNoKu: "わたの原 漕ぎいでてみれば ひさかたの", kamiNoKu: "雲ゐにまがふ 沖つ白波", yomi: "わたのはらこぎ" },
  { id: 77, shimoNoKu: "瀬をはやみ 岩にせかるる 滝川の", kamiNoKu: "われても末に 逢はむとぞ思ふ", yomi: "せをはやみ" },
  { id: 78, shimoNoKu: "淡路島 かよふ千鳥の 鳴く声に", kamiNoKu: "いく夜寝覚めぬ 須磨の関守", yomi: "あわじしま" },
  { id: 79, shimoNoKu: "秋風に たなびく雲の 絶え間より", kamiNoKu: "もれいづる月の 影のさやけさ", yomi: "あきかぜに" },
  { id: 80, shimoNoKu: "長からむ 心も知らず 黒髪の", kamiNoKu: "乱れてけさは ものをこそ思へ", yomi: "ながからん" },
  { id: 81, shimoNoKu: "ほととぎす 鳴きつる方を ながむれば", kamiNoKu: "ただ有明の 月ぞ残れる", yomi: "ほととぎす" },
  { id: 82, shimoNoKu: "思ひわび さても命は あるものを", kamiNoKu: "憂にたへぬは 涙なりけり", yomi: "おもいわび" },
  { id: 83, shimoNoKu: "世の中よ 道こそなけれ 思ひ入る", kamiNoKu: "山の奥にも 鹿ぞ鳴くなる", yomi: "よのなかよ" },
  { id: 84, shimoNoKu: "ながらへば またこのごろや しのばれむ", kamiNoKu: "うしと見し世ぞ 今は恋しき", yomi: "ながらえば" },
  { id: 85, shimoNoKu: "夜もすがら もの思ふころは 明けやらで", kamiNoKu: "ねやのひまさへ つれなかりけり", yomi: "よもすがら" },
  { id: 86, shimoNoKu: "嘆けとて 月やは物を 思はする", kamiNoKu: "かこち顔なる わが涙かな", yomi: "なげけとて" },
  { id: 87, shimoNoKu: "村雨の 露もまだひぬ まきの葉に", kamiNoKu: "霧立ちのぼる 秋の夕暮れ", yomi: "むらさめの" },
  { id: 88, shimoNoKu: "難波江の 芦のかりねの ひとよゆゑ", kamiNoKu: "みをつくしても 逢はむとぞ思ふ", yomi: "なにわえの" },
  { id: 89, shimoNoKu: "玉の緒よ 絶えなば絶えね ながらへば", kamiNoKu: "忍ぶることの 弱りもぞする", yomi: "たまのおよ" },
  { id: 90, shimoNoKu: "見せばやな 雄島のあまの 袖だにも", kamiNoKu: "濡れにぞ濡れし 色はかはらず", yomi: "みせばやな" },
  { id: 91, shimoNoKu: "きりぎりす 鳴くや霜夜の さむしろに", kamiNoKu: "衣かたしき ひとりかも寝む", yomi: "きりぎりす" },
  { id: 92, shimoNoKu: "わが袖は 潮干に見えぬ 沖の石の", kamiNoKu: "人こそ知らね かわく間もなし", yomi: "わがそでは" },
  { id: 93, shimoNoKu: "世の中は 常にもがもな 渚こぐ", kamiNoKu: "海人の小舟の 綱手かなしも", yomi: "よのなかは" },
  { id: 94, shimoNoKu: "み吉野の 山の秋風 小夜更けて", kamiNoKu: "ふるさと寒く 衣打つなり", yomi: "みよしのの" },
  { id: 95, shimoNoKu: "おほけなく うき世の民に おほふかな", kamiNoKu: "わが立つ杣に 墨染の袖", yomi: "おおけなく" },
  { id: 96, shimoNoKu: "花さそふ 嵐の庭の 雪ならで", kamiNoKu: "ふりゆくものは わが身なりけり", yomi: "はなさそう" },
  { id: 97, shimoNoKu: "来ぬ人を まつほの浦の 夕なぎに", kamiNoKu: "焼くや藻塩の 身もこがれつつ", yomi: "こぬひとを" },
  { id: 98, shimoNoKu: "風そよぐ 楢の小川の 夕ぐれは", kamiNoKu: "みそぎぞ夏の しるしなりける", yomi: "かぜそよぐ" },
  { id: 99, shimoNoKu: "人も惜し 人も恨めし あぢきなく", kamiNoKu: "世を思ふゆゑに もの思ふ身は", yomi: "ひともおし" },
  { id: 100, shimoNoKu: "ももしきや ふるき軒端の しのぶにも", kamiNoKu: "なほあまりある 昔なりけり", yomi: "ももしきや" },
];

export type FieldId = string;

export interface CardPlacement {
  cardId: number;
  row: number;
  col: number;
}

export const MY_FIELD_POSITIONS: CardPlacement[] = [
  { cardId: 1, row: 0, col: 0 },
  { cardId: 3, row: 0, col: 1 },
  { cardId: 5, row: 0, col: 2 },
  { cardId: 7, row: 0, col: 3 },
  { cardId: 9, row: 0, col: 4 },
  { cardId: 11, row: 1, col: 0 },
  { cardId: 13, row: 1, col: 1 },
  { cardId: 15, row: 1, col: 2 },
  { cardId: 17, row: 1, col: 3 },
  { cardId: 19, row: 1, col: 4 },
  { cardId: 21, row: 2, col: 0 },
  { cardId: 23, row: 2, col: 1 },
  { cardId: 25, row: 2, col: 2 },
  { cardId: 27, row: 2, col: 3 },
  { cardId: 29, row: 2, col: 4 },
  { cardId: 31, row: 3, col: 0 },
  { cardId: 33, row: 3, col: 1 },
  { cardId: 35, row: 3, col: 2 },
  { cardId: 37, row: 3, col: 3 },
  { cardId: 39, row: 3, col: 4 },
  { cardId: 41, row: 4, col: 0 },
  { cardId: 43, row: 4, col: 1 },
  { cardId: 45, row: 4, col: 2 },
  { cardId: 47, row: 4, col: 3 },
  { cardId: 49, row: 4, col: 4 },
];

export const OPPONENT_CARD_IDS = [
  2, 4, 6, 8, 10, 12, 14, 16, 18, 20,
  22, 24, 26, 28, 30, 32, 34, 36, 38, 40,
  42, 44, 46, 48, 50
];

export function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
