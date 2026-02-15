'use client';

export default function HoverCard() {
    return (
        <div className="hcard" id="hcard">
            <div className="hcard-inner">
                <img className="hcard-img" id="hcImg" src="" alt="" />
                <div className="hcard-body">
                    <div className="hcard-top">
                        <div><div className="hcard-city" id="hcCity"></div><div className="hcard-country" id="hcCountry"></div></div>
                        <div className="hcard-price-col"><div className="hcard-price" id="hcPrice"></div><div className="hcard-old" id="hcOld"></div></div>
                    </div>
                    <div className="hcard-meta"><span id="hcRoute"></span><span id="hcDates"></span></div>
                    <div className="hcard-tags" id="hcTags"></div>
                </div>
            </div>
        </div>
    );
}
