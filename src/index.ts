import 'igniteui-webcomponents/themes/light/bootstrap.css'

import '@webcomponents/custom-elements/custom-elements.min';
import '@webcomponents/custom-elements/src/native-shim.js';

import {
    IgcLegendModule,
    IgcDataChartCoreModule,
    IgcDataChartCategoryModule,
    IgcDataChartCategoryCoreModule,
    IgcDataChartInteractivityModule,
    IgcDataChartAnnotationModule,
    IgcDataChartVerticalCategoryModule,
    IgcAnnotationLayerProxyModule,
    IgcCalloutPlacementPositionsCollection
} from '@infragistics/igniteui-webcomponents-charts';
import {
    IgcColumnSeriesComponent,
    IgcPointSeriesComponent,
    IgcLegendComponent,
    IgcDataChartComponent,
    IgcCategoryXAxisComponent,
    IgcNumericYAxisComponent,
    IgcNumericXAxisComponent,
    IgcDataToolTipLayerComponent,
    IgcCalloutLayerComponent
} from '@infragistics/igniteui-webcomponents-charts';
import { IgcValueOverlayModule } from '@infragistics/igniteui-webcomponents-charts';
import { HighestGrossingMoviesItem, HighestGrossingMovies } from './HighestGrossingMovies';
import { DataTemplateMeasureInfo, DataTemplateRenderInfo, ModuleManager, Visibility } from '@infragistics/igniteui-webcomponents-core';

ModuleManager.register(
    IgcLegendModule,
    IgcDataChartCoreModule,
    IgcDataChartCategoryModule,
    IgcDataChartCategoryCoreModule,
    IgcDataChartInteractivityModule,
    IgcDataChartVerticalCategoryModule,
    IgcValueOverlayModule,
    IgcDataChartAnnotationModule,
    IgcAnnotationLayerProxyModule,
);

export class SKNextColumnChart {

    private legend: IgcLegendComponent
    private chart: IgcDataChartComponent
    private xAxis: IgcCategoryXAxisComponent
    private yAxis: IgcNumericYAxisComponent
    private columnSeries: IgcColumnSeriesComponent
    //private pointSeries: IgcPointSeriesComponent
    //private calloutLayer: IgcCalloutLayerComponent
    private _bind: () => void;

    constructor() {
        var legend = this.legend = document.getElementById('Legend') as IgcLegendComponent;
        var chart = this.chart = document.getElementById('Chart') as IgcDataChartComponent;
        var yAxis = this.yAxis = document.getElementById('yAxis') as IgcNumericYAxisComponent;
        var xAxis = this.xAxis = document.getElementById('xAxis') as IgcCategoryXAxisComponent
        //var calloutLayer = this.calloutLayer = document.getElementById('CalloutLayer') as IgcCalloutLayerComponent;
        var columnSeries = this.columnSeries = document.getElementById('ColumnSeries') as IgcColumnSeriesComponent;
        //var pointSeries = this.pointSeries = document.getElementById('PointSeries') as IgcPointSeriesComponent;

        this._bind = () => {
            chart.legend = this.legend;
            xAxis.dataSource = this.highestGrossingMovies;
            xAxis.tickLength = 0;
            xAxis.labelTopMargin = 10;
            xAxis.labelTextStyle = "12px Helvetica";
            yAxis.majorStrokeThickness = 0;
            yAxis.labelTextStyle = "12px Helvetica";
            yAxis.formatLabel = function (num) {
                return num.toLocaleString();
            };
            columnSeries.xAxis = this.xAxis;
            columnSeries.yAxis = this.yAxis;
            columnSeries.dataSource = this.highestGrossingMovies;
            columnSeries.shouldHideAutoCallouts = false;
            columnSeries.markerTemplate = this.getMarker();
            //pointSeries.xAxis = this.xAxis;
            //pointSeries.yAxis = this.yAxis;
            //pointSeries.dataSource = this.highestGrossingMovies;
        }
        this._bind();
    }

    public getMarker(): any {
        const targetField = this.columnSeries.valueMemberPath;
        return {
            measure: function (measureInfo: DataTemplateMeasureInfo) {
                const context = measureInfo.context;
                const height = context.measureText("M").width;
                const width = measureInfo.data.item[targetField].toLocaleString().length * 8;
                measureInfo.width = width;
                measureInfo.height = height + 12;
            },
            render: function (renderInfo: DataTemplateRenderInfo) {
                let ctx = renderInfo.context;
                let x = renderInfo.xPosition;
                let y = renderInfo.yPosition;

                if (renderInfo.isHitTestRender) return;
                const dataItem = renderInfo.data.item;
                if (dataItem === null) return;

                const dataValue = dataItem[targetField];

                ctx.fillStyle = '#ceddee';
                const width = dataValue.toLocaleString().length * 8;
                let height = renderInfo.availableHeight;
                ctx.beginPath();
                ctx.roundRect(x - (width / 2), y - (height*1.3), width, height*0.75, 5);
                ctx.fill();

                ctx.font = 'bold 12px Helvetica';
                ctx.textAlign = 'center';
                ctx.fontWeight = 'bolder';
                ctx.fillStyle = "black";

                ctx.fillText(dataValue.toLocaleString(), x, y - (height*0.75))

                ctx.beginPath();
                ctx.stroke();
                ctx.fill();
            }
        }
    }

    private _highestGrossingMovies: HighestGrossingMovies | undefined;
    public get highestGrossingMovies(): HighestGrossingMovies {
        if (this._highestGrossingMovies == null)
        {
            this._highestGrossingMovies = new HighestGrossingMovies();
        }
        return this._highestGrossingMovies;
    }

}

new SKNextColumnChart();
