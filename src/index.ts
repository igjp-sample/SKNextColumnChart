import 'igniteui-webcomponents/themes/light/bootstrap.css'

import '@webcomponents/custom-elements/custom-elements.min';
import '@webcomponents/custom-elements/src/native-shim.js';

// Modules
import {
    IgcLegendModule, IgcDataChartCoreModule, IgcDataChartCategoryModule,
    IgcDataChartCategoryCoreModule, IgcDataChartInteractivityModule, IgcDataChartAnnotationModule,
    IgcDataChartVerticalCategoryModule, IgcAnnotationLayerProxyModule, IgcDataChartToolbarModule,
    IgcDataChartCategoryTrendLineModule, IgcValueOverlayModule, ThumbRangePosition
} from '@infragistics/igniteui-webcomponents-charts';
import {
    IgcToolbarModule, IgcToolActionLabelModule
} from '@infragistics/igniteui-webcomponents-layouts';

// Components
import {
    IgcColumnSeriesComponent, IgcLegendComponent, IgcDataChartComponent,
    IgcCategoryXAxisComponent, IgcNumericYAxisComponent, IgcCrosshairLayerComponent,
    IgcCalloutLayerComponent, IgcSeriesViewerComponent, IgcCategorySeriesComponent,
} from '@infragistics/igniteui-webcomponents-charts';
import {
    IgcToolbarComponent
} from '@infragistics/igniteui-webcomponents-layouts';

// EventArgs
import {
    IgcAssigningCategoryStyleEventArgs, IgcDataChartMouseButtonEventArgs, IgcCalloutLabelUpdatingEventArgs,
} from '@infragistics/igniteui-webcomponents-charts';
import {
    IgcToolCommandEventArgs
} from '@infragistics/igniteui-webcomponents-layouts';

// Core
import { ModuleManager } from '@infragistics/igniteui-webcomponents-core';

ModuleManager.register(
    IgcLegendModule,
    IgcDataChartCoreModule,
    IgcDataChartCategoryModule,
    IgcDataChartCategoryCoreModule,
    IgcDataChartInteractivityModule,
    IgcDataChartCategoryTrendLineModule,
    IgcDataChartVerticalCategoryModule,
    IgcValueOverlayModule,
    IgcDataChartAnnotationModule,
    IgcAnnotationLayerProxyModule,
    IgcToolbarModule,
    IgcDataChartToolbarModule,
    IgcToolActionLabelModule,
);

declare global {
    interface Window {
        revealBridge: any;
        revealBridgeListener: any;
    }
}

/**
 * ノードを表すインターフェースです。
 */
interface Node {
    id: string;
    name: string;
    children?: Node[]; // 再帰的な型定義で子ノードを持つ
}

interface ColumnData {
    name: string;
    type: number;
}

// drillDownTypeプロパティの型定義
type DrillDownType = 'Date' | 'UserDefined';

export class SKNextColumnChart {

    private legend: IgcLegendComponent
    private toolbar: IgcToolbarComponent
    private chart: IgcDataChartComponent
    private xAxis: IgcCategoryXAxisComponent
    private yAxis: IgcNumericYAxisComponent
    private columnSeries: IgcColumnSeriesComponent

    private drillUp: HTMLElement;
    private drillDown: HTMLElement;
    private customTooltip: HTMLElement;
    private tooltipTitle: HTMLElement;

    private dataNodeLayer!: Node;

    private _bind: () => void;

    /**
     * Revealから渡されるオリジナルのデータを保持するプロパティです。
     * チャートの表示に利用するデータ以外も含むため、NEXT会員登録機能などで利用することができます。
     */
    private tabularData: { [key: string]: any; }[] | undefined;

    /**
     * チャートの表示を行うためのデータを保持するプロパティです。
     * ドリルダウンの際は、このプロパティにを再集計してチャートを更新します。
     */
    private chartData: any[] | undefined;

    /**
     * チャートのcategoryXAxisに対応するカラム名を保持するプロパティです。
     */
    private category: string = "";

    /**
     * 集計対象のカラム名を保持するプロパティです。
     */
    private aggregationTargetColumn: string = "";

    /**
     * チャートの複数選択機能を有効にするかどうかを示すフラグです。
     */
    private enableSelecting: boolean = false;

    /**
     * ドリルダウン機能を有効にするかどうかを示すフラグです。
     */
    private canDrillDown: boolean = false;

    /**
     * ドリルダウンのタイプを表すプロパティです。
     * ドリルダウンのタイプは、'Date' または 'UserDefined' のいずれかです。
     */
    private drillDownType: DrillDownType = 'Date';

    private currentDataNodeLayer: string = '';

    // ユーザー定義のドリルダウン機能をテストする際にtrueに設定します。本番では使用しないでください。
    private isUserDefineDrilldownTest: boolean = false;

    /**
     * このプロパティは、ドリルダウン機能によってチャートの階層を制御するために使用されます。
     * categoryXAxisの対象（Revealチャートエディターの「行」フィールドの先頭データ）がDate型の場合、こちらを使用します。
     * Date型利用時の階層を変更したい場合、こちらを変更してください。
     */
    readonly dateNodeLayer: Node = {
        "id": "1",
        "name": "Years",
        "children": [
            {
                "id": "2",
                "name": "Month",
                "children": [
                    {
                        "id": "3",
                        "name": "Date"
                    }
                ]
            }
        ]
    };

    readonly mouseMoveEvent = new MouseEvent('mousemove', { bubbles: true, cancelable: true });

    constructor() {
        this.onAssigningCategoryStyle = this.onAssigningCategoryStyle.bind(this);
        this.onCalloutLabelUpdating = this.onCalloutLabelUpdating.bind(this);
        this.toolbarToggleAction = this.toolbarToggleAction.bind(this);

        var toolbar = this.toolbar = document.getElementById('Toolbar') as IgcToolbarComponent;
        var chart = this.chart = document.getElementById('Chart') as unknown as IgcDataChartComponent;
        var yAxis = this.yAxis = document.getElementById('yAxis') as unknown as IgcNumericYAxisComponent;
        var xAxis = this.xAxis = document.getElementById('xAxis') as unknown as IgcCategoryXAxisComponent;
        var columnSeries = this.columnSeries = document.getElementById('ColumnSeries') as unknown as IgcColumnSeriesComponent;
        var chartContainer = document.getElementById('ChartContainer') as HTMLDivElement;
        var drillUp = this.drillUp = document.getElementById('DrillUp') as HTMLElement;
        var drillDown = this.drillDown = document.getElementById('DrillDown') as HTMLElement;
        var calloutLayer = document.getElementById('CalloutLayer') as unknown as IgcCalloutLayerComponent;
        var crosshairLayer = document.getElementById('CrosshairLayer') as IgcCrosshairLayerComponent;
        this.customTooltip = document.getElementById('CustomTooltip') as HTMLElement;
        this.tooltipTitle = document.getElementById('TooltipTitle') as HTMLElement;
        this.legend = document.getElementById('Legend') as unknown as IgcLegendComponent;

        this._bind = () => {
            // 主にチャート表現やイベントハンドラの初期設定を行っています。
            toolbar.target = this.chart;
            toolbar.onCommand = this.toolbarToggleAction;
            chart.legend = this.legend;
            xAxis.tickLength = 0;
            xAxis.labelTextStyle = "12px Roboto";
            yAxis.majorStrokeThickness = 0;
            yAxis.labelTextStyle = "12px Roboto";
            yAxis.formatLabel = function (num) {
                return num.toLocaleString();
            };
            columnSeries.xAxis = this.xAxis;
            columnSeries.yAxis = this.yAxis;
            columnSeries.isCustomCategoryStyleAllowed = true;
            columnSeries.assigningCategoryStyle = this.onAssigningCategoryStyle;
            calloutLayer.calloutLabelUpdating = this.onCalloutLabelUpdating;
            calloutLayer.textStyle = "500 12px 'Roboto'";
            chart.seriesMouseLeftButtonUp = this.onSeriesMouseLeftButtonUp;
            chart.onmousemove = this.onMouseEnter;
            chartContainer.onmouseleave = this.onMouseLeave;
            crosshairLayer.cursorPosition = { x: 0, y: 0 };
            xAxis.formatLabel = this.formatDateString;
            drillUp.onclick = this.onDrillUpClick;
            drillDown.onclick = this.onDrillDownClick;
        }
        this._bind();
        this.toolbarCustomIconOnViewInit();

        window.revealBridgeListener = {
            dataReady: (incomingData: any) => {
                console.log(incomingData); // Reveal から渡されるデータです。
                const columns = incomingData.metadata.columns;
                this.category = columns[0].name;
                this.columnSeries.title = this.getLastWordFromString(columns[columns.length - 1].name); //「sum of xxx」のような形式の文字列がRevealから渡されるため、最後の単語のみを取得します。
                this.tabularData = this.combineColumnAndData(columns, incomingData.data);
                console.log(this.tabularData);
                this.aggregationTargetColumn = columns[columns.length - 1].name;
                this.chartData = this.aggregateDataByCategory(this.tabularData, this.category, this.aggregationTargetColumn);
                this.updateChart(this.chartData);
            }
        };
        window.revealBridge.notifyExtensionIsReady();

    }


    /**
     * Calloutラベルが更新されるときに呼び出されるコールバック関数です。
     * ラベルの値が数値である場合、カンマ区切りの形式でフォーマットします。
     * @param sender - イベントの発生元であるIgcCalloutLayerComponentオブジェクト
     * @param event - イベントの引数であるIgcCalloutLabelUpdatingEventArgsオブジェクト
     */
    private onCalloutLabelUpdating(sender: IgcCalloutLayerComponent, event: IgcCalloutLabelUpdatingEventArgs) {
        if (event.item != null) {
            let value = parseFloat(event.item.value);
            if (!isNaN(value)) {
                event.label = value.toLocaleString(); // 数値をカンマ区切りの形式でフォーマットする
            }
        }
    }

    /**
     * カテゴリのスタイルを割り当てる際に呼び出されるコールバック関数です。
     * チャートの各アイテムに対して処理を行います。
     * チャートの複数選択がfalseの場合、アイテムのisSelectedプロパティをfalseに設定し、選択状態を解除します。
     * チャートの複数選択がtrueの場合、選択されているチャートのスタイルを変更します。
     * @param sender - イベントの発生元であるIgcCategorySeriesComponentオブジェクト
     * @param event - イベントの引数であるIgcAssigningCategoryStyleEventArgsオブジェクト
     */
    public onAssigningCategoryStyle = (sender: IgcCategorySeriesComponent, event: IgcAssigningCategoryStyleEventArgs) => {
        let items = event.getItems(event.startIndex, event.endIndex);
        for (let i = 0; i < items.length; i++) {
            if (!this.enableSelecting) {
                items[i].isSelected = false;
            } else {
                if (items[i].isSelected) {
                    event.strokeThickness = 5;
                    event.fill = "#3a6b8e";
                }
            }
        }
    }

    public onDrillUpClick = () => {
        const parentNode = this.findParentNode(this.dataNodeLayer, this.currentDataNodeLayer) as Node;
        if (parentNode !== null) {
            this.currentDataNodeLayer = parentNode?.name;
            if (this.tabularData) {
                this.chartData = this.aggregateDataByCategory(this.tabularData, this.currentDataNodeLayer, this.aggregationTargetColumn);
                this.updateChart(this.chartData);
            }
        }
        this.columnSeries.notifyVisualPropertiesChanged();
        const currentNode = this.findNodeByName(this.dataNodeLayer, this.currentDataNodeLayer) as Node;
        this.setDisplayStyles(currentNode);
        this.chart.dispatchEvent(this.mouseMoveEvent);
    }

    public onDrillDownClick = () => {
        const currentNode = this.findNodeByName(this.dataNodeLayer, this.currentDataNodeLayer) as Node;
        const childNode = currentNode?.children?.[0] as Node;
        if (childNode) {
            this.currentDataNodeLayer = childNode.name as string;
            if (this.tabularData && this.drillDown.getAttribute("drillTo") !== null) {
                if (this.drillDownType === "Date") {
                    this.chartData = this.aggregateDataByCategory(this.tabularData, this.currentDataNodeLayer, this.aggregationTargetColumn)
                        .filter((item: any) => item.category.startsWith(this.drillDown.getAttribute("drillTo")));
                }
                if (this.drillDownType === "UserDefined") {
                    const parentNode = this.findParentNode(this.dataNodeLayer, this.currentDataNodeLayer) as Node;
                    const filteredTabularData = this.tabularData.filter((item: any) => item[parentNode.name] === this.drillDown.getAttribute("drillTo"));
                    this.chartData = this.aggregateDataByCategory(filteredTabularData, this.currentDataNodeLayer, this.aggregationTargetColumn);
                }
                this.updateChart(this.chartData);
            }
        }
        this.columnSeries.notifyVisualPropertiesChanged();
        this.setDisplayStyles(currentNode);
        this.chart.dispatchEvent(this.mouseMoveEvent);
    }

    /**
     * マウスがチャートコンテナ要素から離れたときに呼び出されるコールバック関数です。
     * イベントが発生した場合、カスタムツールチップの表示を非表示にします。
     * @param event - マウスイベント
     */
    public onMouseLeave = ( event: MouseEvent ) => {
        if (event) {
            if (this.customTooltip) {
                this.customTooltip.style.display = 'none';
            }
        }
    }

    /**
     * シリーズビューアのマウスの左ボタンが離されたイベントを処理します。
     * チャートの複数選択が有効な場合、chartData配列のisSelectedプロパティを更新します。
     * 最後にnotifyVisualPropertiesChangedメソッドを呼び出して、チャートの外観を更新（onAssigningCategoryStyleを呼び出し）します。
     * @param sender - イベントの発生元であるIgcSeriesViewerComponentオブジェクト
     * @param event - イベントの引数であるIgcDataChartMouseButtonEventArgsオブジェクト
     */
    public onSeriesMouseLeftButtonUp = (sender: IgcSeriesViewerComponent, event: IgcDataChartMouseButtonEventArgs) => {
        if (this.enableSelecting) {
            if (event.item) {
                event.item.isSelected = !event.item.isSelected;
                this.chartData?.forEach((dataItem: any) => {
                    if (dataItem.category === event.item.category) {
                        dataItem.isSelected = event.item.isSelected;
                    }
                });
                this.columnSeries.notifyVisualPropertiesChanged();
            }
        }
    }

    /**
     * 日付文字列をフォーマットする関数です。
     * 日付の形式が YYYY-MM-DDThh:mm:ss に一致するかチェックします。
     * 条件に一致する場合、日付を指定したフォーマットに変換して返します。
     * 一致しない場合は、元の文字列をそのまま返します。
     * @param item - フォーマットする日付文字列を含むオブジェクト
     * @returns - フォーマットされた日付文字列または元の文字列
     */
    public formatDateString(item: any): string {
        const regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/;
        if (regex.test(item.category)) {
            const dateObject = new Date(item.category);
            return dateObject.getFullYear() + "/" + (dateObject.getMonth() + 1) + "/" + dateObject.getDate(); // 必要に応じて日付のフォーマットを変更してください
        }
        return item.category;
    }

    /**
     * マウスがチャートエリアに入ったときに呼び出されるコールバック関数です。
     * ドリルダウンが有効である場合にのみカスタムツールチップを表示します。
     * マウスの位置からツールチップの表示位置を設定します。
     * チャートエリア内にいない場合、カスタムツールチップを非表示にします。
     * チャートエリア内にいる場合、カスタムツールチップを表示し、ツールチップのタイトルをフォーマットします。
     * @param event - マウスイベント
     */
    public onMouseEnter = (event: MouseEvent) => {
        if (this.enableSelecting || !this.canDrillDown) return;

        const worldPosition = this.columnSeries.toWorldPosition({ x: event.clientX, y: event.clientY });
        const currentNode = this.findNodeByName(this.dataNodeLayer, this.currentDataNodeLayer) as Node;
        this.setDisplayStyles(currentNode);

        const isWithinChartArea = 0 < worldPosition.x && worldPosition.x < 1 && 0 < worldPosition.y && worldPosition.y < 1;
        if (!isWithinChartArea) {
            if (this.customTooltip) {
                this.customTooltip.style.display = 'none';
            }
            return;
        }

        if (this.customTooltip) {
            const Item = this.columnSeries.getItem({ x: worldPosition.x, y: worldPosition.y});
            var x = event.clientX;
            if (x + this.customTooltip.offsetWidth > window.innerWidth) {
                x -= this.customTooltip.offsetWidth;
            }
            this.customTooltip.style.left = x + 'px';
            this.customTooltip.style.display = 'block';
            if (this.tooltipTitle) {
                this.tooltipTitle.innerText = this.formatTooltipTitle(Item);
            }
        }
    }

    private formatTooltipTitle(Item: any): string {
        if (!this.canDrillDown) return Item.category;

        if (this.drillDownType === "Date") {
            const dateObject = new Date(Item.category);
            if (this.currentDataNodeLayer === "Date") {
                this.drillDown.removeAttribute("drillTo");
                return `${dateObject.getFullYear()}年${dateObject.getMonth() + 1}月${dateObject.getDate()}日`;
            } else if (this.currentDataNodeLayer === "Month") {
                this.drillDown.setAttribute("drillTo", Item.category.slice(0, 7));
                return `${dateObject.getFullYear()}年${dateObject.getMonth() + 1}月`;
            } else if (this.currentDataNodeLayer === "Years") {
                this.drillDown.setAttribute("drillTo", Item.category.slice(0, 4));
                return `${dateObject.getFullYear()}年`;
            }
        }
        //TODO: ユーザー定義のドリルダウンの場合の処理を追加してください。
        if (this.drillDownType === "UserDefined") {
            const currentNode = this.findNodeByName(this.dataNodeLayer, this.currentDataNodeLayer) as Node;
            if (!this.isBottomLevel(currentNode)) {
                this.drillDown.setAttribute("drillTo", Item.category);
            } else {
                this.drillDown.removeAttribute("drillTo");
            }
            return Item.category;
        }

        return ""; // Add a default return value
    }

    /**
     * ツールバーのNextIconメニューのアイコンを設定します。
     */
    public toolbarCustomIconOnViewInit(): void {
        const icon = '<svg width="22px" height="22px" stroke="none" viewBox="0 0 224.87999 225" height="300" preserveAspectRatio="xMidYMid meet" version="1.0"><defs><clipPath id="3e09cefffb"><path d="M 76 30.199219 L 224.761719 30.199219 L 224.761719 179 L 76 179 Z M 76 30.199219 " clip-rule="nonzero"/></clipPath><clipPath id="336336d306"><path d="M 60.277344 46 L 209 46 L 209 195 L 60.277344 195 Z M 60.277344 46 " clip-rule="nonzero"/></clipPath></defs><g clip-path="url(#3e09cefffb)"><path fill="#bebfbf" d="M 224.851562 178.777344 L 76.273438 30.199219 L 118.8125 30.199219 L 194.769531 106.15625 L 194.769531 30.199219 L 224.851562 30.199219 Z M 224.851562 178.777344 " fill-opacity="1" fill-rule="evenodd"/></g><g clip-path="url(#336336d306)"><path fill="#3661ac" d="M 60.296875 46.21875 L 208.878906 194.796875 L 166.335938 194.796875 L 90.378906 118.839844 L 90.378906 194.796875 L 60.296875 194.796875 Z M 60.296875 46.21875 " fill-opacity="1" fill-rule="evenodd"/></g></svg>';
        this.toolbar.registerIconFromText("CustomCollection", "NextIcon", icon);
    }

    /**
     * ツールバーのトグルアクションを処理する関数です。
     * @param sender - イベントの発生元オブジェクト
     * @param args - イベント引数
     */
    public toolbarToggleAction(sender: any, args: IgcToolCommandEventArgs): void {
        switch (args.command.commandId)
        {
            case "GetSelectedData": // NEXT会員登録機能メニューがクリックされた場合
                const isAllFalse = (this.chartData as { isSelected: boolean }[]).every(item => item.isSelected === false);
                if (isAllFalse) {
                    alert("チャートが選択されていません。");
                } else {
                    const selectedCategories = (this.chartData as { isSelected: boolean, category: string }[]).filter(item => item.isSelected === true).map(item => item.category); // 選択されたチャートのカテゴリを取得
                    const filterProperty = this.canDrillDown ? this.currentDataNodeLayer : this.category; // ドリルダウンが有効な場合、ドリルダウンの階層に応じたプロパティを取得します。
                    const filteredData = this.tabularData?.filter(item => selectedCategories.includes(item[filterProperty]));
                    console.log(filteredData);
                }
                break;
            case "EnableSelecting": // チャート選択モードメニューがクリックされた場合
                var enable = args.command.argumentsList[0].value as boolean;
    			if (enable) {
    				this.enableSelecting = true;
                    if (this.customTooltip) {
                        this.customTooltip.style.display = 'none'; // ドリルダウン機能を無効にするため、カスタムツールチップを非表示にします。
                    }
    			} else {
    				this.enableSelecting = false;
                    this.columnSeries.notifyVisualPropertiesChanged(); //チャート選択モードが無効になるため、チャートの選択状態をクリアします。
                }
                break;
        }
    }

    /**
     * チャートを更新します。
     * @param chartData - 更新するチャートのデータ
     */
    private updateChart(chartData: any) {
        this.columnSeries.dataSource = chartData;
        this.yAxis.maximumValue = this.findMaxValueAndIncreaseFirstDigit(chartData).increasedValue;
        this.xAxis.dataSource = chartData;
    }

    /**
     * カラムとデータを結合する関数です。Revealから取得したデータを整形するために使用します。
     * @param fields - カラムのフィールド情報を含むオブジェクト
     * @param data - 結合するデータ配列
     * @returns - 結合されたデータ配列
     */
    private combineColumnAndData(fields: { [x: string]: {
        type: number; name: string | number;
    }; }, data: any[]) {
        var transformFields = Object.values(fields);
        var transformedData = data;
        if(fields[0].type == 3) { // categoryXAxisがDate型の場合
            this.dataNodeLayer = this.dateNodeLayer;
            this.canDrillDown = true;
            this.currentDataNodeLayer = "Date";
            this.insertDrilldownLayerNamesIntoColumn(this.dateNodeLayer, transformFields as { type: number; name: string; }[]);
            transformedData = this.transformDateData(data);
        } else if (this.isUserDefineDrilldownTest) {
            // ユーザー定義のドリルダウン機能をテストするための処理を追加してください。
            this.canDrillDown = true;
            this.drillDownType = 'UserDefined';
            this.currentDataNodeLayer = transformFields[0].name as string; // Revealチャートエディターの「行」フィールドの先頭データを初期ノードレイヤーとして設定します。
            /**
             * 暫定的に、Revealチャートエディターの「行」フィールドの先頭と２つ目のデータをそれぞれ親ノードと子ノードとして設定します。
             */
            var drillDownNamesArray = [transformFields[0].name as string, transformFields[1].name as string];
            this.dataNodeLayer = this.createNodeLayer(drillDownNamesArray);
        }
        return transformedData.map(record => {
            const combinedRecord: { [key: string]: any } = {}; // Add index signature
            record.forEach((value: any, index: string | number) => {
                combinedRecord[transformFields[Number(index)].name] = value;
            });
            return combinedRecord;
        });
    }

    private transformDateData(data: any[]) {
        return data.map(item => {
            let date = new Date(item[0]);
            let year = date.getFullYear();
            let month = ('0' + (date.getMonth() + 1)).slice(-2);
            return [
                item[0],
                `${year}-${month}`,
                `${year}`,
                ...item.slice(1)
            ];
        });
    }

    private insertDrilldownLayerNamesIntoColumn = ( node: Node, columnData: ColumnData[] ): void => {
        const namesToInsert: string[] = [];
        const collectNames = (data: Node) => {
            if (data.children && data.children.length > 0) {
                namesToInsert.push(data.name);
                data.children.forEach(collectNames);
            }
        };
        collectNames(node);
        namesToInsert.reverse().forEach((name, index) => {
            if (index + 1 < columnData.length) {
                columnData.splice(index + 1, 0, { "name": name, "type": 4 });
            }
        });
    };

    /**
     * カテゴリごとにデータを集計します。
     * @param data - 集計するデータ配列
     * @param category - カテゴリのプロパティ名
     * @param target - 集計する対象のプロパティ名
     * @returns - カテゴリごとに集計されたデータ配列
     */
    private aggregateDataByCategory(data: any[], category: string, target: any) {
        const aggregatedData: { [key: string]: number } = {};
        data.forEach((item) => {
            const cat = item[category];
            const sum = item[target];
            if (aggregatedData[cat]) {
                aggregatedData[cat] += sum;
            } else {
                aggregatedData[cat] = sum;
            }
        });
        return Object.keys(aggregatedData).map((key) => ({
            "category": String(key),
            "value": aggregatedData[key],
            "isSelected": false
        }));
    }

    /**
     * ドリルダウン階層におけるメニューの表示スタイルを設定します。
     * ノードが最上層の場合、ドリルアップボタンを非表示にし、ドリルダウンボタンを表示します。
     * ノードが最下層の場合、ドリルアップボタンを表示し、ドリルダウンボタンを非表示にします。
     * ノードが中間層の場合、ドリルアップボタンとドリルダウンボタンを表示します。
     * @param node - 表示スタイルを設定するノード
     */
    private setDisplayStyles(node: Node) {
        if (this.isTopLevel(node, this.dataNodeLayer)) {
            this.setDrillStyles("none", "flex");
        } else if(this.isBottomLevel(node)) {
            this.setDrillStyles("flex", "none");
        } else {
            this.setDrillStyles("flex", "flex");
        }
    }

    /**
     * ドリルアップボタンとドリルダウンボタンの表示スタイルを設定します。
     * @param drillUpDisplay - ドリルアップボタンの表示スタイル
     * @param drillDownDisplay - ドリルダウンボタンの表示スタイル
     */
    private setDrillStyles(drillUpDisplay: string, drillDownDisplay: string) {
        this.drillUp.style.display = drillUpDisplay;
        this.drillDown.style.display = drillDownDisplay;
    }


    /**
     * データ配列から最大値を見つけ、最大値の1桁目を増加させた値を返します。
     * YnumericAxisの最大値に、実際の最大値より若干余白をもたせるために使用します。
     * @param data - 最大値を見つけるためのデータ配列
     * @returns - 最大値と増加させた値のオブジェクト
     */
    private findMaxValueAndIncreaseFirstDigit(data: any[]) {
        const maxValue = data.reduce((max, item) => Math.max(max, item.value), data[0].value);
        const increasedValue = maxValue * 1.15;
        return { maxValue, increasedValue };
    }

    // ==================================================================
    // = ドリルダウン機能有効時における、ノードレイヤーの操作関連メソッドです。
    // ==================================================================

    private createNodeLayer (names: string[]): Node {
        let rootNode: Node = { id: "1", name: names[0] };
        let currentNode = rootNode;

        for (let i = 1; i < names.length; i++) {
          const newNode: Node = { id: (i + 1).toString(), name: names[i] };
          if (!currentNode.children) {
            currentNode.children = [];
          }
          currentNode.children.push(newNode);
          currentNode = newNode;
        }

        return rootNode;
    }

    /**
     * 文字列から最後の単語を取得します。
     * @param inputString - 最後の単語を取得する対象の文字列
     * @returns - 最後の単語
     */
    private getLastWordFromString(inputString: string) {
        // 文字列を半角スペースで分割
        const words = inputString.split(' ');
        // 分割した配列から最後の要素を取得
        return words[words.length - 1];
    }

    /**
     * ノードが最上層のアイテムかどうかを判別します。
     * @param node - 判別するノード
     * @param rootNode - ルートノード
     * @returns - 最上層のアイテムであればtrue、そうでなければfalse
     */
    private isTopLevel(node: Node, rootNode: Node): boolean {
        return node === rootNode;
    }

    /**
     * ノードが最下層のアイテムかどうかを判別します。
     * @param node - 判別するノード
     * @returns - 最下層のアイテムであればtrue、そうでなければfalse
     */
    private isBottomLevel(node: Node): boolean {
        return !node.children || node.children.length === 0;
    }

    /**
     * ノード名を指定してノードを検索します。
     * @param node - 検索を開始するノード
     * @param name - 検索するノードの名前
     * @returns - 検索されたノード、見つからない場合はnull
     */
    private findNodeByName<T>(node: Node, name: string): Node | null {
        // 現在のノードが目的のnameを持つかチェック
        if (node.name === name) {
          return node;
        }
        // 子ノードがあれば、それぞれを再帰的に探索
        if (node.children) {
          for (const child of node.children) {
            const result = this.findNodeByName(child, name);
            if (result) {
              return result; // 目的のノードが見つかったら、すぐに返す
            }
          }
        }
        // 目的のノードが見つからなければnullを返す
        return null;
    }

    /**
     * 指定されたノードの親ノードを検索します。
     * @param node - 検索を開始するノード
     * @param targetName - 検索する親ノードの名前
     * @param parent - 再帰的な呼び出しのための親ノード
     * @returns - 検索された親ノード、見つからない場合はnull
     */
    private findParentNode<T>(node: Node, targetName: string, parent: Node | null = null): Node | null {
        // 子ノードを探索
        if (node.children) {
          for (const child of node.children) {
            // 指定された名前のノードを見つけた場合、その親ノードを返す
            if (child.name === targetName) {
                if (parent === null) { // 親ノードがない場合は、その最上位のノードを返す
                    return this.findNodeByName(node, this.dataNodeLayer.name);
                } else {
                    return parent;
                }
            }
            // 子ノードにさらに子ノードがある場合は、再帰的に探索
            const foundParent = this.findParentNode(child, targetName, child);
            if (foundParent) {
              return foundParent;
            }
          }
        }
        // 指定された名前のノードまたはその親ノードが見つからない場合
        return null;
    }

}

new SKNextColumnChart();
