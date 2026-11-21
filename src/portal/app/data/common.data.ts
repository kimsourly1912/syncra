import type { SelectMenuItem } from '@nuxt/ui'

export interface CountryItem {
  label: string
  code: string
  dialCode: string
}

export interface IndustryItem {
  label: string
  value: string
}

export interface CompanySizeItem {
  label: string
  value: string
}

export type SelectMenuItemWithValue<T> = {
  value: T
} & SelectMenuItem

export const phoneCodes = ['+855', '+852', '+86', '+858']
export const contactMethods = ['Email', 'Phone', 'Whatapp', 'Telegram']

export const companySizes: SelectMenuItem[] = [
  {
    label: 'small (5-49)',
    value: 'small',
  },
  {
    label: 'medium (50-199)',
    value: 'medium',
  },
  {
    label: 'large (200+)',
    value: 'large',
  },
]

export const countries: SelectMenuItem[] = [
  {
    label: 'Afghanistan',
    dialCode: '+93',
    code: 'AF',
  },
  {
    label: 'Aland Islands',
    dialCode: '+358',
    code: 'AX',
  },
  {
    label: 'Albania',
    dialCode: '+355',
    code: 'AL',
  },
  {
    label: 'Algeria',
    dialCode: '+213',
    code: 'DZ',
  },
  {
    label: 'AmericanSamoa',
    dialCode: '+1684',
    code: 'AS',
  },
  {
    label: 'Andorra',
    dialCode: '+376',
    code: 'AD',
  },
  {
    label: 'Angola',
    dialCode: '+244',
    code: 'AO',
  },
  {
    label: 'Anguilla',
    dialCode: '+1264',
    code: 'AI',
  },
  {
    label: 'Antarctica',
    dialCode: '+672',
    code: 'AQ',
  },
  {
    label: 'Antigua and Barbuda',
    dialCode: '+1268',
    code: 'AG',
  },
  {
    label: 'Argentina',
    dialCode: '+54',
    code: 'AR',
  },
  {
    label: 'Armenia',
    dialCode: '+374',
    code: 'AM',
  },
  {
    label: 'Aruba',
    dialCode: '+297',
    code: 'AW',
  },
  {
    label: 'Australia',
    dialCode: '+61',
    code: 'AU',
  },
  {
    label: 'Austria',
    dialCode: '+43',
    code: 'AT',
  },
  {
    label: 'Azerbaijan',
    dialCode: '+994',
    code: 'AZ',
  },
  {
    label: 'Bahamas',
    dialCode: '+1242',
    code: 'BS',
  },
  {
    label: 'Bahrain',
    dialCode: '+973',
    code: 'BH',
  },
  {
    label: 'Bangladesh',
    dialCode: '+880',
    code: 'BD',
  },
  {
    label: 'Barbados',
    dialCode: '+1246',
    code: 'BB',
  },
  {
    label: 'Belarus',
    dialCode: '+375',
    code: 'BY',
  },
  {
    label: 'Belgium',
    dialCode: '+32',
    code: 'BE',
  },
  {
    label: 'Belize',
    dialCode: '+501',
    code: 'BZ',
  },
  {
    label: 'Benin',
    dialCode: '+229',
    code: 'BJ',
  },
  {
    label: 'Bermuda',
    dialCode: '+1441',
    code: 'BM',
  },
  {
    label: 'Bhutan',
    dialCode: '+975',
    code: 'BT',
  },
  {
    label: 'Bolivia, Plurinational State of',
    dialCode: '+591',
    code: 'BO',
  },
  {
    label: 'Bosnia and Herzegovina',
    dialCode: '+387',
    code: 'BA',
  },
  {
    label: 'Botswana',
    dialCode: '+267',
    code: 'BW',
  },
  {
    label: 'Brazil',
    dialCode: '+55',
    code: 'BR',
  },
  {
    label: 'British Indian Ocean Territory',
    dialCode: '+246',
    code: 'IO',
  },
  {
    label: 'Brunei Darussalam',
    dialCode: '+673',
    code: 'BN',
  },
  {
    label: 'Bulgaria',
    dialCode: '+359',
    code: 'BG',
  },
  {
    label: 'Burkina Faso',
    dialCode: '+226',
    code: 'BF',
  },
  {
    label: 'Burundi',
    dialCode: '+257',
    code: 'BI',
  },
  {
    label: 'Cambodia',
    dialCode: '+855',
    code: 'KH',
  },
  {
    label: 'Cameroon',
    dialCode: '+237',
    code: 'CM',
  },
  {
    label: 'Canada',
    dialCode: '+1',
    code: 'CA',
  },
  {
    label: 'Cape Verde',
    dialCode: '+238',
    code: 'CV',
  },
  {
    label: 'Cayman Islands',
    dialCode: '+ 345',
    code: 'KY',
  },
  {
    label: 'Central African Republic',
    dialCode: '+236',
    code: 'CF',
  },
  {
    label: 'Chad',
    dialCode: '+235',
    code: 'TD',
  },
  {
    label: 'Chile',
    dialCode: '+56',
    code: 'CL',
  },
  {
    label: 'China',
    dialCode: '+86',
    code: 'CN',
  },
  {
    label: 'Christmas Island',
    dialCode: '+61',
    code: 'CX',
  },
  {
    label: 'Cocos (Keeling) Islands',
    dialCode: '+61',
    code: 'CC',
  },
  {
    label: 'Colombia',
    dialCode: '+57',
    code: 'CO',
  },
  {
    label: 'Comoros',
    dialCode: '+269',
    code: 'KM',
  },
  {
    label: 'Congo',
    dialCode: '+242',
    code: 'CG',
  },
  {
    label: 'Congo, The Democratic Republic of the Congo',
    dialCode: '+243',
    code: 'CD',
  },
  {
    label: 'Cook Islands',
    dialCode: '+682',
    code: 'CK',
  },
  {
    label: 'Costa Rica',
    dialCode: '+506',
    code: 'CR',
  },
  {
    label: 'Cote d\'Ivoire',
    dialCode: '+225',
    code: 'CI',
  },
  {
    label: 'Croatia',
    dialCode: '+385',
    code: 'HR',
  },
  {
    label: 'Cuba',
    dialCode: '+53',
    code: 'CU',
  },
  {
    label: 'Cyprus',
    dialCode: '+357',
    code: 'CY',
  },
  {
    label: 'Czech Republic',
    dialCode: '+420',
    code: 'CZ',
  },
  {
    label: 'Denmark',
    dialCode: '+45',
    code: 'DK',
  },
  {
    label: 'Djibouti',
    dialCode: '+253',
    code: 'DJ',
  },
  {
    label: 'Dominica',
    dialCode: '+1767',
    code: 'DM',
  },
  {
    label: 'Dominican Republic',
    dialCode: '+1849',
    code: 'DO',
  },
  {
    label: 'Ecuador',
    dialCode: '+593',
    code: 'EC',
  },
  {
    label: 'Egypt',
    dialCode: '+20',
    code: 'EG',
  },
  {
    label: 'El Salvador',
    dialCode: '+503',
    code: 'SV',
  },
  {
    label: 'Equatorial Guinea',
    dialCode: '+240',
    code: 'GQ',
  },
  {
    label: 'Eritrea',
    dialCode: '+291',
    code: 'ER',
  },
  {
    label: 'Estonia',
    dialCode: '+372',
    code: 'EE',
  },
  {
    label: 'Ethiopia',
    dialCode: '+251',
    code: 'ET',
  },
  {
    label: 'Falkland Islands (Malvinas)',
    dialCode: '+500',
    code: 'FK',
  },
  {
    label: 'Faroe Islands',
    dialCode: '+298',
    code: 'FO',
  },
  {
    label: 'Fiji',
    dialCode: '+679',
    code: 'FJ',
  },
  {
    label: 'Finland',
    dialCode: '+358',
    code: 'FI',
  },
  {
    label: 'France',
    dialCode: '+33',
    code: 'FR',
  },
  {
    label: 'French Guiana',
    dialCode: '+594',
    code: 'GF',
  },
  {
    label: 'French Polynesia',
    dialCode: '+689',
    code: 'PF',
  },
  {
    label: 'Gabon',
    dialCode: '+241',
    code: 'GA',
  },
  {
    label: 'Gambia',
    dialCode: '+220',
    code: 'GM',
  },
  {
    label: 'Georgia',
    dialCode: '+995',
    code: 'GE',
  },
  {
    label: 'Germany',
    dialCode: '+49',
    code: 'DE',
  },
  {
    label: 'Ghana',
    dialCode: '+233',
    code: 'GH',
  },
  {
    label: 'Gibraltar',
    dialCode: '+350',
    code: 'GI',
  },
  {
    label: 'Greece',
    dialCode: '+30',
    code: 'GR',
  },
  {
    label: 'Greenland',
    dialCode: '+299',
    code: 'GL',
  },
  {
    label: 'Grenada',
    dialCode: '+1473',
    code: 'GD',
  },
  {
    label: 'Guadeloupe',
    dialCode: '+590',
    code: 'GP',
  },
  {
    label: 'Guam',
    dialCode: '+1671',
    code: 'GU',
  },
  {
    label: 'Guatemala',
    dialCode: '+502',
    code: 'GT',
  },
  {
    label: 'Guernsey',
    dialCode: '+44',
    code: 'GG',
  },
  {
    label: 'Guinea',
    dialCode: '+224',
    code: 'GN',
  },
  {
    label: 'Guinea-Bissau',
    dialCode: '+245',
    code: 'GW',
  },
  {
    label: 'Guyana',
    dialCode: '+595',
    code: 'GY',
  },
  {
    label: 'Haiti',
    dialCode: '+509',
    code: 'HT',
  },
  {
    label: 'Holy See (Vatican City State)',
    dialCode: '+379',
    code: 'VA',
  },
  {
    label: 'Honduras',
    dialCode: '+504',
    code: 'HN',
  },
  {
    label: 'Hong Kong',
    dialCode: '+852',
    code: 'HK',
  },
  {
    label: 'Hungary',
    dialCode: '+36',
    code: 'HU',
  },
  {
    label: 'Iceland',
    dialCode: '+354',
    code: 'IS',
  },
  {
    label: 'India',
    dialCode: '+91',
    code: 'IN',
  },
  {
    label: 'Indonesia',
    dialCode: '+62',
    code: 'ID',
  },
  {
    label: 'Iran, Islamic Republic of Persian Gulf',
    dialCode: '+98',
    code: 'IR',
  },
  {
    label: 'Iraq',
    dialCode: '+964',
    code: 'IQ',
  },
  {
    label: 'Ireland',
    dialCode: '+353',
    code: 'IE',
  },
  {
    label: 'Isle of Man',
    dialCode: '+44',
    code: 'IM',
  },
  {
    label: 'Israel',
    dialCode: '+972',
    code: 'IL',
  },
  {
    label: 'Italy',
    dialCode: '+39',
    code: 'IT',
  },
  {
    label: 'Jamaica',
    dialCode: '+1876',
    code: 'JM',
  },
  {
    label: 'Japan',
    dialCode: '+81',
    code: 'JP',
  },
  {
    label: 'Jersey',
    dialCode: '+44',
    code: 'JE',
  },
  {
    label: 'Jordan',
    dialCode: '+962',
    code: 'JO',
  },
  {
    label: 'Kazakhstan',
    dialCode: '+77',
    code: 'KZ',
  },
  {
    label: 'Kenya',
    dialCode: '+254',
    code: 'KE',
  },
  {
    label: 'Kiribati',
    dialCode: '+686',
    code: 'KI',
  },
  {
    label: 'Korea, Democratic People\'s Republic of Korea',
    dialCode: '+850',
    code: 'KP',
  },
  {
    label: 'Korea, Republic of South Korea',
    dialCode: '+82',
    code: 'KR',
  },
  {
    label: 'Kuwait',
    dialCode: '+965',
    code: 'KW',
  },
  {
    label: 'Kyrgyzstan',
    dialCode: '+996',
    code: 'KG',
  },
  {
    label: 'Laos',
    dialCode: '+856',
    code: 'LA',
  },
  {
    label: 'Latvia',
    dialCode: '+371',
    code: 'LV',
  },
  {
    label: 'Lebanon',
    dialCode: '+961',
    code: 'LB',
  },
  {
    label: 'Lesotho',
    dialCode: '+266',
    code: 'LS',
  },
  {
    label: 'Liberia',
    dialCode: '+231',
    code: 'LR',
  },
  {
    label: 'Libyan Arab Jamahiriya',
    dialCode: '+218',
    code: 'LY',
  },
  {
    label: 'Liechtenstein',
    dialCode: '+423',
    code: 'LI',
  },
  {
    label: 'Lithuania',
    dialCode: '+370',
    code: 'LT',
  },
  {
    label: 'Luxembourg',
    dialCode: '+352',
    code: 'LU',
  },
  {
    label: 'Macao',
    dialCode: '+853',
    code: 'MO',
  },
  {
    label: 'Macedonia',
    dialCode: '+389',
    code: 'MK',
  },
  {
    label: 'Madagascar',
    dialCode: '+261',
    code: 'MG',
  },
  {
    label: 'Malawi',
    dialCode: '+265',
    code: 'MW',
  },
  {
    label: 'Malaysia',
    dialCode: '+60',
    code: 'MY',
  },
  {
    label: 'Maldives',
    dialCode: '+960',
    code: 'MV',
  },
  {
    label: 'Mali',
    dialCode: '+223',
    code: 'ML',
  },
  {
    label: 'Malta',
    dialCode: '+356',
    code: 'MT',
  },
  {
    label: 'Marshall Islands',
    dialCode: '+692',
    code: 'MH',
  },
  {
    label: 'Martinique',
    dialCode: '+596',
    code: 'MQ',
  },
  {
    label: 'Mauritania',
    dialCode: '+222',
    code: 'MR',
  },
  {
    label: 'Mauritius',
    dialCode: '+230',
    code: 'MU',
  },
  {
    label: 'Mayotte',
    dialCode: '+262',
    code: 'YT',
  },
  {
    label: 'Mexico',
    dialCode: '+52',
    code: 'MX',
  },
  {
    label: 'Micronesia, Federated States of Micronesia',
    dialCode: '+691',
    code: 'FM',
  },
  {
    label: 'Moldova',
    dialCode: '+373',
    code: 'MD',
  },
  {
    label: 'Monaco',
    dialCode: '+377',
    code: 'MC',
  },
  {
    label: 'Mongolia',
    dialCode: '+976',
    code: 'MN',
  },
  {
    label: 'Montenegro',
    dialCode: '+382',
    code: 'ME',
  },
  {
    label: 'Montserrat',
    dialCode: '+1664',
    code: 'MS',
  },
  {
    label: 'Morocco',
    dialCode: '+212',
    code: 'MA',
  },
  {
    label: 'Mozambique',
    dialCode: '+258',
    code: 'MZ',
  },
  {
    label: 'Myanmar',
    dialCode: '+95',
    code: 'MM',
  },
  {
    label: 'Namibia',
    dialCode: '+264',
    code: 'NA',
  },
  {
    label: 'Nauru',
    dialCode: '+674',
    code: 'NR',
  },
  {
    label: 'Nepal',
    dialCode: '+977',
    code: 'NP',
  },
  {
    label: 'Netherlands',
    dialCode: '+31',
    code: 'NL',
  },
  {
    label: 'Netherlands Antilles',
    dialCode: '+599',
    code: 'AN',
  },
  {
    label: 'New Caledonia',
    dialCode: '+687',
    code: 'NC',
  },
  {
    label: 'New Zealand',
    dialCode: '+64',
    code: 'NZ',
  },
  {
    label: 'Nicaragua',
    dialCode: '+505',
    code: 'NI',
  },
  {
    label: 'Niger',
    dialCode: '+227',
    code: 'NE',
  },
  {
    label: 'Nigeria',
    dialCode: '+234',
    code: 'NG',
  },
  {
    label: 'Niue',
    dialCode: '+683',
    code: 'NU',
  },
  {
    label: 'Norfolk Island',
    dialCode: '+672',
    code: 'NF',
  },
  {
    label: 'Northern Mariana Islands',
    dialCode: '+1670',
    code: 'MP',
  },
  {
    label: 'Norway',
    dialCode: '+47',
    code: 'NO',
  },
  {
    label: 'Oman',
    dialCode: '+968',
    code: 'OM',
  },
  {
    label: 'Pakistan',
    dialCode: '+92',
    code: 'PK',
  },
  {
    label: 'Palau',
    dialCode: '+680',
    code: 'PW',
  },
  {
    label: 'Palestinian Territory, Occupied',
    dialCode: '+970',
    code: 'PS',
  },
  {
    label: 'Panama',
    dialCode: '+507',
    code: 'PA',
  },
  {
    label: 'Papua New Guinea',
    dialCode: '+675',
    code: 'PG',
  },
  {
    label: 'Paraguay',
    dialCode: '+595',
    code: 'PY',
  },
  {
    label: 'Peru',
    dialCode: '+51',
    code: 'PE',
  },
  {
    label: 'Philippines',
    dialCode: '+63',
    code: 'PH',
  },
  {
    label: 'Pitcairn',
    dialCode: '+872',
    code: 'PN',
  },
  {
    label: 'Poland',
    dialCode: '+48',
    code: 'PL',
  },
  {
    label: 'Portugal',
    dialCode: '+351',
    code: 'PT',
  },
  {
    label: 'Puerto Rico',
    dialCode: '+1939',
    code: 'PR',
  },
  {
    label: 'Qatar',
    dialCode: '+974',
    code: 'QA',
  },
  {
    label: 'Romania',
    dialCode: '+40',
    code: 'RO',
  },
  {
    label: 'Russia',
    dialCode: '+7',
    code: 'RU',
  },
  {
    label: 'Rwanda',
    dialCode: '+250',
    code: 'RW',
  },
  {
    label: 'Reunion',
    dialCode: '+262',
    code: 'RE',
  },
  {
    label: 'Saint Barthelemy',
    dialCode: '+590',
    code: 'BL',
  },
  {
    label: 'Saint Helena, Ascension and Tristan Da Cunha',
    dialCode: '+290',
    code: 'SH',
  },
  {
    label: 'Saint Kitts and Nevis',
    dialCode: '+1869',
    code: 'KN',
  },
  {
    label: 'Saint Lucia',
    dialCode: '+1758',
    code: 'LC',
  },
  {
    label: 'Saint Martin',
    dialCode: '+590',
    code: 'MF',
  },
  {
    label: 'Saint Pierre and Miquelon',
    dialCode: '+508',
    code: 'PM',
  },
  {
    label: 'Saint Vincent and the Grenadines',
    dialCode: '+1784',
    code: 'VC',
  },
  {
    label: 'Samoa',
    dialCode: '+685',
    code: 'WS',
  },
  {
    label: 'San Marino',
    dialCode: '+378',
    code: 'SM',
  },
  {
    label: 'Sao Tome and Principe',
    dialCode: '+239',
    code: 'ST',
  },
  {
    label: 'Saudi Arabia',
    dialCode: '+966',
    code: 'SA',
  },
  {
    label: 'Senegal',
    dialCode: '+221',
    code: 'SN',
  },
  {
    label: 'Serbia',
    dialCode: '+381',
    code: 'RS',
  },
  {
    label: 'Seychelles',
    dialCode: '+248',
    code: 'SC',
  },
  {
    label: 'Sierra Leone',
    dialCode: '+232',
    code: 'SL',
  },
  {
    label: 'Singapore',
    dialCode: '+65',
    code: 'SG',
  },
  {
    label: 'Slovakia',
    dialCode: '+421',
    code: 'SK',
  },
  {
    label: 'Slovenia',
    dialCode: '+386',
    code: 'SI',
  },
  {
    label: 'Solomon Islands',
    dialCode: '+677',
    code: 'SB',
  },
  {
    label: 'Somalia',
    dialCode: '+252',
    code: 'SO',
  },
  {
    label: 'South Africa',
    dialCode: '+27',
    code: 'ZA',
  },
  {
    label: 'South Sudan',
    dialCode: '+211',
    code: 'SS',
  },
  {
    label: 'South Georgia and the South Sandwich Islands',
    dialCode: '+500',
    code: 'GS',
  },
  {
    label: 'Spain',
    dialCode: '+34',
    code: 'ES',
  },
  {
    label: 'Sri Lanka',
    dialCode: '+94',
    code: 'LK',
  },
  {
    label: 'Sudan',
    dialCode: '+249',
    code: 'SD',
  },
  {
    label: 'Suriname',
    dialCode: '+597',
    code: 'SR',
  },
  {
    label: 'Svalbard and Jan Mayen',
    dialCode: '+47',
    code: 'SJ',
  },
  {
    label: 'Swaziland',
    dialCode: '+268',
    code: 'SZ',
  },
  {
    label: 'Sweden',
    dialCode: '+46',
    code: 'SE',
  },
  {
    label: 'Switzerland',
    dialCode: '+41',
    code: 'CH',
  },
  {
    label: 'Syrian Arab Republic',
    dialCode: '+963',
    code: 'SY',
  },
  {
    label: 'Taiwan',
    dialCode: '+886',
    code: 'TW',
  },
  {
    label: 'Tajikistan',
    dialCode: '+992',
    code: 'TJ',
  },
  {
    label: 'Tanzania, United Republic of Tanzania',
    dialCode: '+255',
    code: 'TZ',
  },
  {
    label: 'Thailand',
    dialCode: '+66',
    code: 'TH',
  },
  {
    label: 'Timor-Leste',
    dialCode: '+670',
    code: 'TL',
  },
  {
    label: 'Togo',
    dialCode: '+228',
    code: 'TG',
  },
  {
    label: 'Tokelau',
    dialCode: '+690',
    code: 'TK',
  },
  {
    label: 'Tonga',
    dialCode: '+676',
    code: 'TO',
  },
  {
    label: 'Trinidad and Tobago',
    dialCode: '+1868',
    code: 'TT',
  },
  {
    label: 'Tunisia',
    dialCode: '+216',
    code: 'TN',
  },
  {
    label: 'Turkey',
    dialCode: '+90',
    code: 'TR',
  },
  {
    label: 'Turkmenistan',
    dialCode: '+993',
    code: 'TM',
  },
  {
    label: 'Turks and Caicos Islands',
    dialCode: '+1649',
    code: 'TC',
  },
  {
    label: 'Tuvalu',
    dialCode: '+688',
    code: 'TV',
  },
  {
    label: 'Uganda',
    dialCode: '+256',
    code: 'UG',
  },
  {
    label: 'Ukraine',
    dialCode: '+380',
    code: 'UA',
  },
  {
    label: 'United Arab Emirates',
    dialCode: '+971',
    code: 'AE',
  },
  {
    label: 'United Kingdom',
    dialCode: '+44',
    code: 'GB',
  },
  {
    label: 'United States',
    dialCode: '+1',
    code: 'US',
  },
  {
    label: 'Uruguay',
    dialCode: '+598',
    code: 'UY',
  },
  {
    label: 'Uzbekistan',
    dialCode: '+998',
    code: 'UZ',
  },
  {
    label: 'Vanuatu',
    dialCode: '+678',
    code: 'VU',
  },
  {
    label: 'Venezuela, Bolivarian Republic of Venezuela',
    dialCode: '+58',
    code: 'VE',
  },
  {
    label: 'Vietnam',
    dialCode: '+84',
    code: 'VN',
  },
  {
    label: 'Virgin Islands, British',
    dialCode: '+1284',
    code: 'VG',
  },
  {
    label: 'Virgin Islands, U.S.',
    dialCode: '+1340',
    code: 'VI',
  },
  {
    label: 'Wallis and Futuna',
    dialCode: '+681',
    code: 'WF',
  },
  {
    label: 'Yemen',
    dialCode: '+967',
    code: 'YE',
  },
  {
    label: 'Zambia',
    dialCode: '+260',
    code: 'ZM',
  },
  {
    label: 'Zimbabwe',
    dialCode: '+263',
    code: 'ZW',
  },
]

export const industries: SelectMenuItem[] = [
  {
    label: 'Garment Manufacturing',
    value: 'Garment',
  },
  {
    label: 'Footwear Manufacturing',
    value: 'Footwear',
  },
  {
    label: 'Bags & Travel Goods Manufacturing',
    value: 'Bags',
  },
  {
    label: 'Textile & Fabric Production',
    value: 'Textile',
  },
  {
    label: 'Food & Beverage Processing',
    value: 'Food',
  },
  {
    label: 'Agriculture & Agro-processing',
    value: 'Agriculture',
  },
  {
    label: 'Wood Products Manufacturing',
    value: 'Wood',
  },
  {
    label: 'Furniture Manufacturing',
    value: 'Furniture',
  },
  {
    label: 'Paper, Printing & Packaging Manufacturing',
    value: 'Paper',
  },

  {
    label: 'Chemical, Rubber & Plastics Manufacturing',
    value: 'Chemical',
  },

  {
    label: 'Non-metallic Mineral Products Manufacturing',
    value: 'Non-metallic',
  },

  {
    label: 'Metal Processing & Fabrication',
    value: 'Metal',
  },

  {
    label: 'Electronics Components & Assembly',
    value: 'Electronics',
  },
  {
    label: 'Automotive Parts Manufacturing',
    value: 'Automotive',
  },
  {
    label: 'Bicycles & Transport Equipment Assembly',
    value: 'Bicycles',
  },

  {
    label: 'Pharmaceuticals & Medical Products Manufacturing',
    value: 'Pharmaceuticals',
  },
  {
    label: 'Cosmetics & Personal Care Manufacturing',
    value: 'Cosmetics',
  },
  {
    label: 'Recycling & Waste Processing',
    value: 'Recycling',
  },
  {
    label: 'Construction Materials Manufacturing',
    value: 'Construction',
  },
]
