// O'zbek telekanallari ro'yxati
// Manba: iptv-org.github.io/iptv/countries/uz.m3u (ochiq playlist)
const channels = [
    {
        id: 'uzbekiston-24',
        name: "O'zbekiston 24",
        category: 'news',
        categoryLabel: 'Yangiliklar',
        logo: 'https://i.imgur.com/VRFhKbw.png',
        url: 'https://stream8.cinerama.uz/1011/tracks-v1a1/playlist.m3u8',
        initials: 'UZ24'
    },
    {
        id: 'uzbekiston',
        name: "O'zbekiston",
        category: 'entertainment',
        categoryLabel: 'Umumiy',
        logo: 'https://i.imgur.com/QUIIhTD.png',
        url: 'https://stream8.cinerama.uz/1001/tracks-v1a1/playlist.m3u8',
        initials: 'UZ'
    },
    {
        id: 'yoshlar',
        name: 'Yoshlar',
        category: 'entertainment',
        categoryLabel: 'Yoshlar',
        logo: 'https://i.imgur.com/s4xfUSx.png',
        url: 'https://stream8.cinerama.uz/1002/tracks-v1a1/playlist.m3u8',
        initials: 'YOS'
    },
    {
        id: 'toshkent',
        name: 'Toshkent',
        category: 'news',
        categoryLabel: 'Mintaqaviy',
        logo: 'https://i.imgur.com/Z9R4nZg.png',
        url: 'https://stream8.cinerama.uz/1003/tracks-v1a1/playlist.m3u8',
        initials: 'TSH'
    },
    {
        id: 'madaniyat',
        name: "Madaniyat va Ma'rifat",
        category: 'entertainment',
        categoryLabel: 'Madaniyat',
        logo: 'https://i.imgur.com/eeNLXCP.png',
        url: 'https://stream8.cinerama.uz/1005/tracks-v1a1/playlist.m3u8',
        initials: 'MAD'
    },
    {
        id: 'dunyo-boylab',
        name: "Dunyo Bo'ylab",
        category: 'entertainment',
        categoryLabel: 'Sayohat',
        logo: 'https://i.imgur.com/KArB5U6.png',
        url: 'https://stream8.cinerama.uz/1006/tracks-v1a1/playlist.m3u8',
        initials: 'DB'
    },
    {
        id: 'bolajon',
        name: 'Bolajon',
        category: 'kids',
        categoryLabel: 'Bolalar',
        logo: 'https://i.imgur.com/s7o0ifu.png',
        url: 'https://stream8.cinerama.uz/1007/playlist.m3u8',
        initials: 'BOL'
    },
    {
        id: 'navo',
        name: 'Navo',
        category: 'music',
        categoryLabel: 'Musiqa',
        logo: 'https://i.imgur.com/7dZ64y9.png',
        url: 'https://stream8.cinerama.uz/1008/tracks-v1a1/playlist.m3u8',
        initials: 'NAV'
    },
    {
        id: 'kinoteatr',
        name: 'Kinoteatr',
        category: 'entertainment',
        categoryLabel: 'Kino',
        logo: 'https://i.imgur.com/emH1BgC.png',
        url: 'https://stream8.cinerama.uz/1009/tracks-v1a1/playlist.m3u8',
        initials: 'KIN'
    },
    {
        id: 'mahalla',
        name: 'Mahalla',
        category: 'entertainment',
        categoryLabel: 'Madaniyat',
        logo: 'https://i.imgur.com/GtABiJI.png',
        url: 'https://stream8.cinerama.uz/1013/tracks-v1a1/playlist.m3u8',
        initials: 'MHL'
    },
    {
        id: 'milliy',
        name: 'Milliy TV',
        category: 'entertainment',
        categoryLabel: 'Milliy',
        logo: 'https://i.imgur.com/v4FBm26.png',
        url: 'https://stream8.cinerama.uz/1014/tracks-v1a1/playlist.m3u8',
        initials: 'MIL'
    },
    {
        id: 'uzreport',
        name: 'UzReport TV',
        category: 'news',
        categoryLabel: 'Yangiliklar',
        logo: 'https://i.imgur.com/Bch2RHc.jpg',
        url: 'https://stream8.cinerama.uz/1015/tracks-v1a1/playlist.m3u8',
        initials: 'UR'
    },
    {
        id: 'zor-tv',
        name: "Zo'r TV",
        category: 'entertainment',
        categoryLabel: "Ko'ngilochar",
        logo: 'https://i.imgur.com/NuzyhVM.png',
        url: 'https://stream8.cinerama.uz/1016/tracks-v1a1/mono.m3u8',
        initials: 'ZR'
    },
    {
        id: 'sevimli',
        name: 'Sevimli TV',
        category: 'entertainment',
        categoryLabel: 'Oilaviy',
        logo: 'https://i.imgur.com/iMwzRlr.png',
        url: 'https://stream8.cinerama.uz/1017/tracks-v1a1/playlist.m3u8',
        initials: 'SEV'
    },
    {
        id: 'ftv',
        name: 'FTV',
        category: 'music',
        categoryLabel: 'Musiqa',
        logo: 'https://i.imgur.com/7lpISyN.jpg',
        url: 'https://stream8.cinerama.uz/1018/playlist.m3u8',
        initials: 'FTV'
    },
    {
        id: 'dasturxon',
        name: 'Dasturxon TV',
        category: 'entertainment',
        categoryLabel: 'Oshxona',
        logo: 'https://i.imgur.com/APM2ej5.jpeg',
        url: 'https://stream8.cinerama.uz/1206/tracks-v1a1/playlist.m3u8',
        initials: 'DSH'
    },
    {
        id: 'uz-tarixi',
        name: "O'zbekiston Tarixi",
        category: 'entertainment',
        categoryLabel: 'Hujjatli',
        logo: 'https://i.imgur.com/iTTd3Ir.png',
        url: 'https://stream8.cinerama.uz/1209/tracks-v1a1/playlist.m3u8',
        initials: 'TRX'
    },
    {
        id: 'renessans',
        name: 'Renessans TV',
        category: 'entertainment',
        categoryLabel: 'Umumiy',
        logo: 'https://i.imgur.com/cVlcqCX.png',
        url: 'https://stream8.cinerama.uz/1221/tracks-v1a1/playlist.m3u8',
        initials: 'REN'
    },
    {
        id: 'andijon',
        name: 'Andijon MTRK',
        category: 'news',
        categoryLabel: 'Mintaqaviy',
        logo: 'https://i.imgur.com/EGPAvom.jpeg',
        url: 'https://stream8.cinerama.uz/1457/tracks-v1a1/mono.m3u8',
        initials: 'AND'
    },
    {
        id: 'fargona',
        name: "Farg'ona MTRK",
        category: 'news',
        categoryLabel: 'Mintaqaviy',
        logo: 'https://i.imgur.com/RYjQOfo.jpeg',
        url: 'https://stream8.cinerama.uz/1458/tracks-v1a1/mono.m3u8',
        initials: 'FAR'
    },
    {
        id: 'buxoro',
        name: 'Buxoro MTRK',
        category: 'news',
        categoryLabel: 'Mintaqaviy',
        logo: 'https://i.imgur.com/jmxPtC9.png',
        url: 'https://stream8.cinerama.uz/1459/tracks-v1a1/mono.m3u8',
        initials: 'BUX'
    },
    {
        id: 'navoiy',
        name: 'Navoiy MTRK',
        category: 'news',
        categoryLabel: 'Mintaqaviy',
        logo: 'https://i.imgur.com/qa4VlYh.png',
        url: 'https://stream8.cinerama.uz/1460/tracks-v1a1/mono.m3u8',
        initials: 'NVI'
    },
    {
        id: 'qaraqalpaqstan',
        name: 'Qaraqalpaqstan',
        category: 'news',
        categoryLabel: 'Mintaqaviy',
        logo: 'https://i.imgur.com/G3qrUJh.png',
        url: 'https://stream8.cinerama.uz/1467/playlist.m3u8',
        initials: 'QQ'
    },
    {
        id: 'makon',
        name: 'Makon TV',
        category: 'entertainment',
        categoryLabel: "Ko'ngilochar",
        logo: 'https://i.imgur.com/vCc0ED1.png',
        url: 'https://stream8.cinerama.uz/1497/tracks-v1a1/mono.m3u8',
        initials: 'MKN'
    },
    {
        id: 'my5',
        name: 'MY5',
        category: 'entertainment',
        categoryLabel: "Ko'ngilochar",
        logo: 'https://i.imgur.com/bjlzu5k.png',
        url: 'https://st.my5.media/hls/hd/index.m3u8',
        initials: 'MY5'
    },
    {
        id: 'biz-tv',
        name: 'BIZ TV',
        category: 'entertainment',
        categoryLabel: "Ko'ngilochar",
        logo: 'https://biztv.uz/static/media/logo.5f993187.png',
        url: 'https://fl.biztv.media/biz_tv_720_uni8jhub4h8fub4idejswh8dh3j94finbu4nidj39inwsj92in3d/index.m3u8',
        initials: 'BIZ'
    },
    {
        id: 'biz-cinema',
        name: 'BIZ Cinema',
        category: 'entertainment',
        categoryLabel: 'Kino',
        logo: 'https://biztv.uz/static/media/biz-cinema.286b83dc.png',
        url: 'https://fl.biztv.media/cinema_720_EMfSyXgoRdiIHgldXTZICucKTIeCKO/index.m3u8',
        initials: 'CIN'
    },
    {
        id: 'biz-music',
        name: 'BIZ Music',
        category: 'music',
        categoryLabel: 'Musiqa',
        logo: 'https://i.ibb.co/DfsCJwk/Uz-biz-music-5462.jpg',
        url: 'https://fl.biztv.media/music_720_QAKpGmVUjaPApCNjpsgBxrdqNihAkl/index.m3u8',
        initials: 'MUS'
    }
];
