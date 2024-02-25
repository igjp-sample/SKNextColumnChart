export class HighestGrossingMoviesItem {
    public constructor(init: Partial<HighestGrossingMoviesItem>) {
        Object.assign(this, init);
    }

    public franchise: string = '';
    public newSales: number = 0;

}
export class HighestGrossingMovies extends Array<HighestGrossingMoviesItem> {
    public constructor(items: Array<HighestGrossingMoviesItem> | number = -1) {
        if (Array.isArray(items)) {
            super(...items);
        } else {
            const newItems = [
                new HighestGrossingMoviesItem(
                {
                    franchise: `Product A`,
                    newSales: 8322064,
                }),
                new HighestGrossingMoviesItem(
                {
                    franchise: `Product B`,
                    newSales: 6485362,
                }),
                new HighestGrossingMoviesItem(
                {
                    franchise: `Product C`,
                    newSales: 7281442,
                }),
                new HighestGrossingMoviesItem(
                {
                    franchise: `Product D`,
                    newSales: 7619920,
                }),
                new HighestGrossingMoviesItem(
                {
                    franchise: `Product E`,
                    newSales: 8405241,
                })
            ];
            super(...(newItems));
        }
    }
}
