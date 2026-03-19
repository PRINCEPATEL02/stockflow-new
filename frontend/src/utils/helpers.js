export const genId    = () => Date.now().toString(36) + Math.random().toString(36).substr(2,5)
export const fc       = (n) => '₹' + Number(n||0).toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2})
export const fd       = (d) => d ? new Date(d).toLocaleDateString('en-IN') : '—'
export const todayStr = ()  => new Date().toISOString().split('T')[0]

export function calcTotals(items=[], isIntra=true) {
  let sub=0,cgst=0,sgst=0,igst=0
  items.forEach(item => {
    const t = (item.qty||0)*(item.price||0)
    sub += t
    const r = item.gstRate||0
    if (isIntra) { cgst += t*r/200; sgst += t*r/200 } else { igst += t*r/100 }
  })
  return { sub, cgst, sgst, igst, tax:cgst+sgst+igst, total:sub+cgst+sgst+igst }
}

export function numToWords(n) {
  const a=['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen']
  const b=['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety']
  if (n===0) return 'Zero'
  const fn=(num)=>{
    if(num<20) return a[num]
    if(num<100) return b[Math.floor(num/10)]+(num%10?' '+a[num%10]:'')
    if(num<1000) return a[Math.floor(num/100)]+' Hundred'+(num%100?' '+fn(num%100):'')
    if(num<100000) return fn(Math.floor(num/1000))+' Thousand'+(num%1000?' '+fn(num%1000):'')
    if(num<10000000) return fn(Math.floor(num/100000))+' Lakh'+(num%100000?' '+fn(num%100000):'')
    return fn(Math.floor(num/10000000))+' Crore'+(num%10000000?' '+fn(num%10000000):'')
  }
  const int=Math.floor(n), dec=Math.round((n-int)*100)
  return fn(int)+' Rupees'+(dec>0?' and '+fn(dec)+' Paise':'')+' Only'
}

export const STATES=['Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal','Andaman & Nicobar','Chandigarh','Dadra & Nagar Haveli','Delhi','Jammu & Kashmir','Ladakh','Lakshadweep','Puducherry']
export const GST_RATES=[0,5,12,18,28]
export const UNITS=['pcs','kg','g','l','ml','m','cm','box','pack','set','bag','roll','sheet','pair']
