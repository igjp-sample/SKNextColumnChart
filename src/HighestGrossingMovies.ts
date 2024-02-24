export class HighestGrossingMoviesItem {
    public constructor(init: Partial<HighestGrossingMoviesItem>) {
        Object.assign(this, init);
    }

    public franchise: string = '';
    public totalRevenue: number = 0;

}
export class HighestGrossingMovies extends Array<HighestGrossingMoviesItem> {
    public constructor(items: Array<HighestGrossingMoviesItem> | number = -1) {
        if (Array.isArray(items)) {
            super(...items);
        } else {
            const newItems = [
                new HighestGrossingMoviesItem(
                {
                    franchise: `Marvel Universe`,
                    totalRevenue: 22.55,
                }),
                new HighestGrossingMoviesItem(
                {
                    franchise: `Star Wars`,
                    totalRevenue: 10.32,
                }),
                new HighestGrossingMoviesItem(
                {
                    franchise: `Harry Potter`,
                    totalRevenue: 9.19,
                }),
                new HighestGrossingMoviesItem(
                {
                    franchise: `Avengers`,
                    totalRevenue: 7.76,
                }),
                new HighestGrossingMoviesItem(
                {
                    franchise: `Spider Man`,
                    totalRevenue: 7.22,
                }),
                new HighestGrossingMoviesItem(
                {
                    franchise: `James Bond`,
                    totalRevenue: 7.12,
                }),
            ];
            super(...(newItems.slice(0, items)));
        }
    }
}
